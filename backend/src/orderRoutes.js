import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { canTransition, validCheckoutItems } from './orderRules.js';

const router = Router();
const shippingFeeCents = 0; // Step 4: free shipping (adjust via shipping policy later).
const money = cents => (cents / 100).toFixed(2);
function auth(req, res, next) {
  const bearer = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
  if (!bearer) return res.status(401).json({ message: 'Please sign in.' });
  try {
    const claims = jwt.verify(bearer[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const id = Number(claims.sub);
    if (!Number.isSafeInteger(id) || id < 1 || !['customer', 'admin'].includes(claims.role)) throw Error('Invalid credentials');
    req.auth = { id, role: claims.role }; next();
  } catch { return res.status(401).json({ message: 'Session expired. Sign in again.' }); }
}
router.use(auth);
const validId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;

async function listItems(connection, orderIds) {
  if (!orderIds.length) return new Map();
  const placeholders = orderIds.map(() => '?').join(',');
  const [rows] = await connection.query(`SELECT oi.order_id, oi.product_id, p.name, p.image_url, oi.quantity, oi.unit_price
    FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id IN (${placeholders}) ORDER BY oi.id`, orderIds);
  const result = new Map(orderIds.map(id => [id, []]));
  for (const row of rows) result.get(row.order_id)?.push(row);
  return result;
}
async function orderDetails(connection, id) {
  const [[order]] = await connection.execute(`SELECT id, user_id, status, recipient_name, phone, province, city, barangay,
      street_address, postal_code, shipping_fee, payment_method, total, created_at, updated_at
      FROM orders WHERE id=?`, [id]);
  if (!order) return null;
  const items = await listItems(connection, [id]);
  return { ...order, items: items.get(id) || [] };
}

router.post('/', async (req, res) => {
  if (req.auth.role !== 'customer') return res.status(403).json({ message: 'Customer account required.' });
  const raw = req.body?.items;
  const key = req.body?.checkout_key;
  if (!validCheckoutItems(raw)) {
    return res.status(400).json({ message: 'Cart must contain unique valid items and quantities.' });
  }
  if (typeof key !== 'string' || !/^[a-zA-Z0-9-]{16,100}$/.test(key)) return res.status(400).json({ message: 'Invalid checkout request. Refresh and retry.' });
  const items = raw.map(item => ({ id: Number(item.product_id), quantity: item.quantity })).sort((a,b) => a.id-b.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[previous]] = await connection.execute('SELECT id FROM orders WHERE user_id=? AND checkout_key=?', [req.auth.id, key]);
    if (previous) {
      const details = await orderDetails(connection, previous.id);
      await connection.commit();
      return res.json({ ...details, already_submitted: true });
    }
    const [[address]] = await connection.execute(`SELECT recipient_name, phone, province, city, barangay, street_address, postal_code
      FROM customer_addresses WHERE user_id=?`, [req.auth.id]);
    if (!address) { await connection.rollback(); return res.status(400).json({ message: 'Save your delivery address before checkout.' }); }
    let subtotalCents = 0;
    const lines = [];
    for (const item of items) {
      const [[product]] = await connection.execute('SELECT id, name, price, stock, is_active FROM products WHERE id=? FOR UPDATE', [item.id]);
      if (!product || !product.is_active) { await connection.rollback(); return res.status(409).json({ message: `Product #${item.id} is no longer available. Refresh your cart.` }); }
      if (product.stock < item.quantity) { await connection.rollback(); return res.status(409).json({ message: `${product.name} only has ${product.stock} unit(s) available. Update your cart.` }); }
      const priceCents = Math.round(Number(product.price) * 100);
      if (!Number.isSafeInteger(priceCents) || priceCents < 0) throw Error('Invalid stored product price');
      subtotalCents += priceCents * item.quantity;
      if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 999999999999) { await connection.rollback(); return res.status(400).json({ message: 'Cart total exceeds supported limit.' }); }
      lines.push({ ...item, priceCents });
    }
    const totalCents = subtotalCents + shippingFeeCents;
    const [result] = await connection.execute(`INSERT INTO orders
      (user_id, status, recipient_name, phone, province, city, barangay, street_address, postal_code, shipping_fee, payment_method, checkout_key, total)
      VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 'cod', ?, ?)`,
      [req.auth.id, address.recipient_name, address.phone, address.province, address.city, address.barangay,
        address.street_address, address.postal_code, money(shippingFeeCents), key, money(totalCents)]);
    for (const item of lines) {
      await connection.execute('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [result.insertId, item.id, item.quantity, money(item.priceCents)]);
      await connection.execute('UPDATE products SET stock=stock-? WHERE id=?', [item.quantity, item.id]);
    }
    const order = await orderDetails(connection, result.insertId);
    await connection.commit();
    return res.status(201).json(order);
  } catch (error) {
    await connection.rollback();
    // If two identical requests race, use the previously committed order instead of creating duplicate.
    if (error.code === 'ER_DUP_ENTRY') {
      const [[existing]] = await pool.execute('SELECT id FROM orders WHERE user_id=? AND checkout_key=?', [req.auth.id, key]);
      if (existing) { return res.json({ ...(await orderDetails(pool, existing.id)), already_submitted: true }); }
    }
    console.error('Place order:', error);
    return res.status(500).json({ message: 'Could not place order. Check your order history before retrying.' });
  } finally {
    // Released only once, including the duplicate-key branch.
    connection.release();
  }
});

router.get('/mine', async (req, res) => {
  if (req.auth.role !== 'customer') return res.status(403).json({ message: 'Customer account required.' });
  try {
    const [orders] = await pool.execute(`SELECT id, status, recipient_name, phone, province, city, barangay, street_address,
      postal_code, shipping_fee, payment_method, total, created_at, updated_at FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 100`, [req.auth.id]);
    const map = await listItems(pool, orders.map(order => order.id));
    res.json(orders.map(order => ({ ...order, items: map.get(order.id) || [] })));
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not load your orders.' }); }
});
router.get('/admin', async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access only.' });
  try {
    const [orders] = await pool.query(`SELECT o.id, o.status, o.recipient_name, o.phone, o.province, o.city, o.barangay,
      o.street_address, o.postal_code, o.shipping_fee, o.payment_method, o.total, o.created_at, o.updated_at,
      u.username, u.email FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.id DESC LIMIT 200`);
    const map = await listItems(pool, orders.map(order => order.id));
    res.json(orders.map(order => ({ ...order, items: map.get(order.id) || [] })));
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not load orders.' }); }
});
router.patch('/admin/:id/status', async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access only.' });
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID.' });
  const next = req.body?.status;
  if (typeof next !== 'string' || !['confirmed', 'shipped', 'delivered', 'cancelled'].includes(next)) return res.status(400).json({ message: 'Invalid new status.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[order]] = await connection.execute('SELECT id, status FROM orders WHERE id=? FOR UPDATE', [Number(req.params.id)]);
    if (!order) { await connection.rollback(); return res.status(404).json({ message: 'Order not found.' }); }
    if (!canTransition(order.status, next)) { await connection.rollback(); return res.status(409).json({ message: `Cannot change ${order.status} to ${next}. Refresh orders.` }); }
    if (next === 'cancelled') {
      const [items] = await connection.execute('SELECT product_id, quantity FROM order_items WHERE order_id=? ORDER BY product_id', [order.id]);
      for (const item of items) await connection.execute('UPDATE products SET stock=stock+? WHERE id=?', [item.quantity, item.product_id]);
    }
    await connection.execute('UPDATE orders SET status=? WHERE id=?', [next, order.id]);
    const details = await orderDetails(connection, order.id);
    await connection.commit(); res.json(details);
  } catch (error) { await connection.rollback(); console.error(error); res.status(500).json({ message: 'Unable to update order status.' }); }
  finally { connection.release(); }
});
export default router;
