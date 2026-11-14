import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const router = Router();
const fields = 'id, name, category, description, price, stock, image_url, is_active, created_at, updated_at';

function adminOnly(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = /^Bearer (\S+)$/i.exec(authorization);
  if (!match) return res.status(401).json({ message: 'Admin login required.' });
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Missing JWT secret');
    const claims = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (claims.role !== 'admin') return res.status(403).json({ message: 'Admin access only.' });
    req.adminId = claims.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session expired. Please log in again.' });
  }
}
router.use(adminOnly);

function validateProduct(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const image_url = typeof body?.image_url === 'string' ? body.image_url.trim() : '';
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  if (!name || name.length > 160 || !category || category.length > 80 || description.length > 5000) return { error: 'Enter a product name (max 160 characters) and category (max 80 characters).' };
  if (body?.price === '' || body?.price === null || !Number.isFinite(price) || price < 0 || price > 99999999.99 || Math.abs(Math.round(price * 100) - price * 100) > 0.000001) return { error: 'Price must be a valid nonnegative amount with at most 2 decimal places.' };
  if (body?.stock === '' || body?.stock === null || !Number.isSafeInteger(stock) || stock < 0 || stock > 100000000) return { error: 'Stock must be a nonnegative whole number (up to 100 million).' };
  if (image_url.length > 800 || (image_url && !/^https?:\/\/[^\s]+$/i.test(image_url))) return { error: 'Image must be a valid http(s) URL under 800 characters.' };
  return { value: { name, category, description, image_url, price, stock } };
}

router.get('/summary', async (_req, res) => {
  try {
    const [[summary]] = await pool.query(`SELECT COUNT(*) AS product_count,
      COALESCE(SUM(stock), 0) AS total_units,
      SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) AS low_stock_count,
      COALESCE(SUM(price * stock), 0) AS inventory_value
      FROM products WHERE is_active = 1`);
    res.json(summary);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load summary.' }); }
});

router.get('/products', async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${fields} FROM products WHERE is_active = 1 ORDER BY id DESC`);
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load inventory.' }); }
});

router.post('/products', async (req, res) => {
  const check = validateProduct(req.body);
  if (check.error) return res.status(400).json({ message: check.error });
  const { name, category, description, price, stock, image_url } = check.value;
  try {
    const [result] = await pool.execute('INSERT INTO products (name, category, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)', [name, category, description, price, stock, image_url]);
    const [[product]] = await pool.execute(`SELECT ${fields} FROM products WHERE id = ?`, [result.insertId]);
    res.status(201).json(product);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to add product.' }); }
});

router.put('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid product ID.' });
  const check = validateProduct(req.body);
  if (check.error) return res.status(400).json({ message: check.error });
  const { name, category, description, price, stock, image_url } = check.value;
  try {
    const [result] = await pool.execute('UPDATE products SET name = ?, category = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ? AND is_active = 1', [name, category, description, price, stock, image_url, id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found.' });
    const [[product]] = await pool.execute(`SELECT ${fields} FROM products WHERE id = ?`, [id]);
    res.json(product);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to update product.' }); }
});

router.patch('/products/:id/stock', async (req, res) => {
  const id = Number(req.params.id);
  const change = Number(req.body?.change);
  if (!Number.isSafeInteger(id) || id < 1 || req.body?.change === '' || !Number.isSafeInteger(change) || change === 0 || Math.abs(change) > 100000000) return res.status(400).json({ message: 'Provide a valid product and nonzero whole-number adjustment.' });
  try {
    // Atomic conditional update prevents stock falling below zero under concurrent requests.
    const [result] = await pool.execute('UPDATE products SET stock = stock + ? WHERE id = ? AND is_active = 1 AND stock + ? BETWEEN 0 AND 100000000', [change, id, change]);
    if (!result.affectedRows) return res.status(409).json({ message: 'Product unavailable or stock adjustment exceeds allowed range.' });
    const [[product]] = await pool.execute(`SELECT ${fields} FROM products WHERE id = ?`, [id]);
    res.json(product);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to adjust stock.' }); }
});

router.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid product ID.' });
  try {
    // Soft deletion preserves references for future orders and historical reporting.
    const [result] = await pool.execute('UPDATE products SET is_active = 0 WHERE id = ? AND is_active = 1', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found.' });
    res.status(204).end();
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to remove product.' }); }
});

export default router;
