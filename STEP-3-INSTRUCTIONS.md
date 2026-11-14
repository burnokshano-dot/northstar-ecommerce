# Northstar E-Commerce — Step 3

This is an **incremental update** to the working Step 2 project.

## A. Back up your database

In XAMPP > phpMyAdmin > northstar_shop > Export > Quick > SQL. Save the .sql file.

## B. Import the Step 3 migration

In phpMyAdmin, select **northstar_shop**, choose **Import**, and select `database/step3-migration.sql`. Click Go.

**Do not re-import `database/schema.sql` or rerun `npm run seed`.** The migration adds only `customer_addresses` and preserves existing product inventory.

## C. Update files

Unzip this package. From the ZIP's `ecommerce-starter` folder, copy these files into your existing working project:

- Replace: `backend/src/server.js`
- Add: `backend/src/customerRoutes.js`
- Replace: `frontend/src/App.jsx`
- Replace: `frontend/src/styles.css`
- Add: `frontend/src/CustomerDashboard.jsx`
- Add: `frontend/src/CartDrawer.jsx`
- Add: `database/step3-migration.sql` (optional after import)

**Keep your current `backend/.env`.** The JWT_SECRET you configured in Step 2 is still used here.

Alternatively, use all files in this ZIP as a full project, but copy your **working** `backend/.env` and `frontend/.env` (if present) into the extracted folders first.

## D. Run both servers

Make sure XAMPP MySQL is running.

Terminal 1 (inside `backend`):

```sh
npm install
npm run dev
```

Terminal 2 (inside `frontend`):

```sh
npm install
npm run dev
```

Browse to http://localhost:5173.

## E. Test Step 3

1. On the storefront, click **Customer login** then **New customer? Create an account**.
2. Register a unique username, valid email, and password with at least 8 characters.
3. You will see **My account**. Choose your **province or NCR**, then enter your **city/municipality**, **barangay**, and full street address. Add the recipient's name and 11-digit Philippine mobile number (starts with 09). Click **Save address**.
4. Click **Back to store**. Add a product to the cart; use plus/minus or delete. A cart subtotal appears.
5. Refresh. Cart lines persist in this browser; the account session does not (you must log in again).
6. Log back in and verify your saved delivery address. Check `customer_addresses` in phpMyAdmin.
7. Log in as `admin` / `admin123` and verify that Step 2 inventory management still works.

## API routes added

- `POST /api/customers/register` — new customer, returns short-lived JWT
- `GET /api/customers/me` — authenticated customer profile
- `GET /api/customers/address` — authenticated saved address
- `PUT /api/customers/address` — authenticated save/update address
- Existing `POST /api/auth/login` now also accepts customer credentials.

## Scope and limitations

- The cart is in browser `localStorage`, not the database; it is browser-specific and not bound to a user account. **Do not use a shared browser for private customer shopping activity.**
- The province is selected from a local list; city/municipality and barangay are typed manually. Address validity and delivery coverage are not yet checked against a geographic directory.
- Cart prices/stocks shown are informational. Cart actions do **not** reserve stock or place orders. The backend will revalidate prices and stock when checkout is implemented in Step 4.
- No payment processing, shipping fee calculation or real order submission yet.
- Sessions are held in memory and expire after 2 hours. Refresh requires signing in again.
- Before real deployment, implement stronger auth protection, rate limiting, secure token storage/session strategy, address validation, CORS/deployment hardening, and replace default admin credentials.

## Troubleshooting

- `JWT_SECRET is not configured`: keep the working 32+ character secret in `backend/.env` and restart backend from the backend folder.
- `Unable to load address`: import `database/step3-migration.sql` using phpMyAdmin, then retry.
- `Cannot connect to API`: start XAMPP MySQL and Express, and check `backend/.env`.
- `Username or email is already registered`: choose a different one or sign in.
