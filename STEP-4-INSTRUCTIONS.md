# Step 4 — Checkout, orders and automatic inventory deduction

This is an UPDATE for a working Step 3 installation. Do not replace your `.env`, re-seed, or re-import `schema.sql`.

## 1. Back up the database

In phpMyAdmin, select `northstar_shop` -> **Export** -> **Quick** -> SQL. Save the backup.

## 2. Run the database migration ONCE

In phpMyAdmin, select `northstar_shop`, choose **Import**, then import `database/step4-migration.sql`.
This migration adds recipient, phone, postal code, shipping, payment method, request-id and updated-at fields to the existing `orders` table. Existing orders and products are preserved. Step 3's `customer_addresses` table must already exist. XAMPP usually ships MariaDB, which supports `ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`; if you use Oracle MySQL instead, those clauses may need manual adaptation.

## 3. Update the code

Copy these paths from the ZIP into your EXISTING project, preserving paths:

- **Replace:** `backend/src/server.js`
- **Add:** `backend/src/orderRoutes.js`
- **Replace:** `frontend/src/App.jsx`
- **Replace:** `frontend/src/CartDrawer.jsx`
- **Replace:** `frontend/src/CustomerDashboard.jsx`
- **Replace:** `frontend/src/AdminDashboard.jsx`
- **Replace:** `frontend/src/styles.css`
- **Add:** `frontend/src/OrdersPanel.jsx`

Keep your own `backend/.env`, `frontend/.env`, and current database. No new npm dependencies are required.

## 4. Restart

1. Start **MySQL** in XAMPP.
2. Backend terminal: `cd backend && npm run dev`
3. Frontend terminal: `cd frontend && npm run dev`
4. Visit `http://localhost:5173`.

## 5. Test in order

1. Sign in with your *customer* account. Open **My account**, fill and SAVE your recipient name, mobile number, province, city, barangay and street address.
2. Add a product to the cart; click **Place order**. A valid customer session and a saved delivery address are required.
3. The API recalculates prices from MySQL (never trusts prices supplied by the browser), locks product rows, checks inventory, and creates the order and order items before deducting stock in one SQL transaction. A successful order clears the cart.
4. Open **My account -> Order history** to see the pending order and shipping details.
5. Log out, sign in as the admin (`admin` / your locally configured password), open **Admin dashboard -> Customer orders**.
6. Move an order from **pending -> confirmed -> shipped -> delivered**. You can cancel from **pending** or **confirmed**. Cancellation restores inventory once; shipped and delivered orders cannot be cancelled in this demo.
7. Try ordering more units than are available: server should show a stock conflict and should not place a partial order.
8. Verify that inventory statistics and storefront stock refresh after checkout or cancellation.

## API summary

- `POST /api/orders` — customer only. Body: `{ "items": [{ "product_id": 1, "quantity": 2 }], "checkout_key": "unique-request-id" }`; uses `Authorization: Bearer <token>`.
- `GET /api/orders/mine` — signed-in customer's order history.
- `GET /api/orders/admin` — admin list (latest 200).
- `PATCH /api/orders/admin/:id/status` — admin order status update; body `{ "status": "confirmed" }`.

## Scope and important notes

- **Payment method:** cash on delivery (COD) only. There is no online payment gateway; do not enter payment card details.
- **Shipping:** PHP 0.00 flat/free shipping **for this demo**. No courier integration, taxes, regional fees or live tracking yet.
- **Security:** keep `.env` private. `JWT_SECRET` must be at least 32 characters. Use `admin123` only for local classroom development; replace it before any public deployment.
- **Request safety:** each checkout is sent with a request key to reduce duplicate orders on retries. Orders and stock are updated transactionally in InnoDB.
- **No production launch yet:** implement real payment/shipping configuration, HTTPS, secure session handling, rate limits, validation tests, and deployment secrets before using the system for real sales.
- **Testing limits:** backend JavaScript syntax validated. Full React build / end-to-end database testing could not run in this environment because npm dependencies and XAMPP MySQL were unavailable. Please test locally.

Next planned stage: Step 5 — final testing, project polish, GitHub preparation and upload.
