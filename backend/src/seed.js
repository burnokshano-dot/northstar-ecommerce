import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { pool } from './db.js';

const products = [
  ['Everyday Canvas Tote', 'Accessories', 'A durable everyday tote for errands and everything in between.', 549, 24, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&auto=format&fit=crop&q=80'],
  ['Minimal Desk Lamp', 'Home', 'Warm lighting and a clean silhouette for focused work.', 1299, 14, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900&auto=format&fit=crop&q=80'],
  ['Wireless Headphones', 'Tech', 'Comfortable over-ear listening for work or travel.', 2499, 12, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80'],
  ['Classic White Sneakers', 'Fashion', 'Versatile low-top sneakers with everyday comfort.', 1899, 18, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900&auto=format&fit=crop&q=80'],
  ['Ceramic Coffee Mug', 'Home', 'A beautifully simple mug for your daily coffee ritual.', 429, 35, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900&auto=format&fit=crop&q=80'],
  ['Stainless Water Bottle', 'Lifestyle', 'Reusable insulated hydration for every outing.', 799, 27, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&auto=format&fit=crop&q=80'],
  ['Compact Backpack', 'Accessories', 'Lightweight essentials organizer for commuting.', 1499, 16, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=80'],
  ['Analog Wristwatch', 'Fashion', 'A timeless, understated everyday accessory.', 2199, 9, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900&auto=format&fit=crop&q=80']
];

try {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);
  const [admins] = await pool.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
  if (!admins.length) {
    await pool.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, passwordHash, 'admin']);
    console.log(`Created development admin: ${username}`);
  } else {
    console.log(`Admin username '${username}' already exists; password unchanged.`);
  }
  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM products');
  if (count === 0) {
    for (const product of products) {
      await pool.execute('INSERT INTO products (name, category, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)', product);
    }
    console.log(`Inserted ${products.length} sample products.`);
  } else {
    console.log(`Products already exist (${count}); no duplicate seeding.`);
  }
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
