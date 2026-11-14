# Northstar Shop — React + Express + XAMPP

A small **local-development ecommerce demo** with a responsive React storefront, customer accounts, shopping cart, Philippine delivery address form, COD orders, and an admin inventory/order dashboard. Product images load from Unsplash and require internet access. Prices are displayed in PHP.

> **Not production-ready.** Do not accept real customers or payment information until authentication, abuse controls, operations, and deployment security are reviewed. Cash on delivery is simulated; no online payment gateway or courier integration is included.

## Stack
- React 18 / Vite 6 frontend, Axios HTTP client, Lucide icons
- Node 22 / Express 4 backend with JWT authentication and bcrypt password hashes
- XAMPP MySQL/MariaDB via `mysql2`, InnoDB transactions for checkout and inventory updates

## First-time setup
1. Install Node 22 and XAMPP. Start **MySQL** in XAMPP (Apache for phpMyAdmin is optional).
2. Open `http://localhost/phpmyadmin` and import `database/schema.sql` to create `northstar_shop`. Then import **in order** `database/step3-migration.sql` and `database/step4-migration.sql`.
3. Copy `backend/.env.example` to `backend/.env`. Check host/port/credentials and set a unique `JWT_SECRET` of **32+ characters**. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Terminal A: `cd backend && npm install && npm run seed && npm run dev`. **Run seed on first installation only.** The default dev admin is `admin` / `admin123` unless you changed the `SEED_ADMIN_*` settings.
5. Terminal B: `cd frontend && npm install && npm run dev`. Open `http://localhost:5173`.
6. For a nondefault API address, copy `frontend/.env.example` to `frontend/.env`, set `VITE_API_URL`, and restart Vite. Backend `FRONTEND_URL` must match the frontend's browser origin.

### Updating an existing Step 4 installation to Step 5
Back up `northstar_shop` in phpMyAdmin. Replace the code files from this release; **keep your current `backend/.env`, your database, and any frontend `.env`**. No Step 5 SQL migration is necessary. **Do not rerun schema imports or the seed script.** Restart both servers.

## Main workflows
- Customers: register/login, choose a province, enter city/municipality, barangay, street, phone, save an address, add products to cart, place COD order, view history.
- Admin: login, view inventory summary, add/update/hide products, adjust stock, review orders, mark confirmed/shipped/delivered, or cancel pending/confirmed orders.
- Inventory is checked and deducted server-side in a database transaction at checkout; eligible cancellations restore stock. Checkout keys help prevent duplicate orders after retries. Cart is local-browser storage, **not** a server-synced cart or stock reservation.

## Check the project
- Backend: `cd backend && npm run check && npm test`
- Frontend: `cd frontend && npm run build`
- API health (requires MySQL and backend): `http://localhost:5000/api/health`
- GitHub Actions automatically runs syntax checks, order-rule unit tests, and frontend build on pushes and pull requests.

## GitHub publishing
Follow [GITHUB-UPLOAD.md](GITHUB-UPLOAD.md). Do not upload `.env`, exported customer database dumps, or real passwords. This repository contains only an example dev admin password **for local demonstration**; change it before using a publicly accessible server.

## Known limitations
- Login JWTs are held in React memory; refreshing the page signs users out.
- Province selection is a simple list; city and barangay are free text, not an authoritative address directory.
- Product photos are hosted externally; availability may change.
- Shipping is free and COD-only by design for this demonstration.
- No payment verification, courier tracking, email verification, password reset, rate limiting, audit trails, or HTTPS deployment setup.
- Unit tests cover business-rule logic, not full database or browser end-to-end workflows. Run the manual acceptance checklist in [STEP-5-INSTRUCTIONS.md](STEP-5-INSTRUCTIONS.md).
