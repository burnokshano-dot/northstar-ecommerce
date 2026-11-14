import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const router = Router();
const secretReady = () => typeof process.env.JWT_SECRET === 'string' && process.env.JWT_SECRET.length >= 32;
const sign = (user) => jwt.sign({ sub: user.id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '2h', algorithm: 'HS256' });

router.post('/register', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return res.status(400).json({ message: 'Username must be 3–30 letters, numbers or underscores.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({ message: 'Password must have 8–72 characters.' });
  if (!secretReady()) return res.status(500).json({ message: 'JWT_SECRET is not configured.' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', [username, email, hash, 'customer']);
    const user = { id: result.insertId, username, email, role: 'customer' };
    res.status(201).json({ token: sign(user), user });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Username or email is already registered.' });
    console.error('Customer registration:', error);
    res.status(500).json({ message: 'Could not create account.' });
  }
});

function customerOnly(req, res, next) {
  const bearer = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
  if (!bearer) return res.status(401).json({ message: 'Customer login required.' });
  try {
    if (!secretReady()) throw Error('Missing secret');
    const claims = jwt.verify(bearer[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (claims.role !== 'customer' || !Number.isSafeInteger(Number(claims.sub))) return res.status(403).json({ message: 'Customer access only.' });
    req.customerId = Number(claims.sub);
    next();
  } catch { res.status(401).json({ message: 'Session expired. Please log in again.' }); }
}

router.use(customerOnly);
router.get('/me', async (req, res) => {
  try {
    const [[user]] = await pool.execute('SELECT id, username, email, role FROM users WHERE id = ? AND role = ?', [req.customerId, 'customer']);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    res.json(user);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not load account.' }); }
});

const clean = (value) => typeof value === 'string' ? value.trim() : '';
router.get('/address', async (req, res) => {
  try {
    const [[address]] = await pool.execute('SELECT recipient_name, phone, province, city, barangay, street_address, postal_code FROM customer_addresses WHERE user_id = ?', [req.customerId]);
    res.json(address || null);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load address. Have you imported the Step 3 migration?' }); }
});
router.put('/address', async (req, res) => {
  const address = {
    recipient_name: clean(req.body?.recipient_name), phone: clean(req.body?.phone), province: clean(req.body?.province),
    city: clean(req.body?.city), barangay: clean(req.body?.barangay), street_address: clean(req.body?.street_address),
    postal_code: clean(req.body?.postal_code),
  };
  if (!address.recipient_name || address.recipient_name.length > 120 || !/^09\d{9}$/.test(address.phone) ||
      !address.province || address.province.length > 120 || !address.city || address.city.length > 120 ||
      !address.barangay || address.barangay.length > 120 || !address.street_address || address.street_address.length > 255 ||
      (address.postal_code && !/^\d{4}$/.test(address.postal_code))) {
    return res.status(400).json({ message: 'Complete all required fields. Phone must be 09XXXXXXXXX; postal code must be 4 digits if provided.' });
  }
  try {
    await pool.execute(`INSERT INTO customer_addresses
      (user_id, recipient_name, phone, province, city, barangay, street_address, postal_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE recipient_name=VALUES(recipient_name), phone=VALUES(phone), province=VALUES(province),
      city=VALUES(city), barangay=VALUES(barangay), street_address=VALUES(street_address), postal_code=VALUES(postal_code)`,
      [req.customerId, ...Object.values(address)]);
    res.json(address);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to save address. Import the Step 3 migration.' }); }
});

export default router;
