# Step 6 — Landing page, Store page, and Customer Sidebar

This is a **frontend-only** upgrade to the working Step 5 Northstar E-Commerce app. No XAMPP database migration or backend change is needed.

## What's different

- **Public landing page:** branded hero, story, benefits, and sign-in / register calls to action; **no products or ordering controls on this page**.
- **Customer login / registration:** opens the **Store** automatically after successful authentication.
- **Store:** dedicated customer-only shopping area with a sidebar. Only the selected page is displayed:
  - Shop products
  - My cart (quantity adjustments and cash-on-delivery checkout)
  - Delivery details (saved Philippine address)
  - My orders (order history and status)
  - My profile
- **Admin:** the Step 5 admin dashboard is unchanged.
- Same Axios API, React project, MySQL XAMPP database, inventory rules, and order endpoints.

## Safest installation procedure

1. Back up your working Step 5 project folder.
2. Extract the Step 6 ZIP.
3. **Keep the original `backend/.env` and any `frontend/.env` unchanged.** The ZIP contains only example env templates, not your secrets.
4. Copy these frontend files from Step 6 into the same paths of your working project:
   - `frontend/src/App.jsx` (replace)
   - `frontend/src/CustomerDashboard.jsx` (replace)
   - `frontend/src/styles.css` (replace)
   - `frontend/src/StorePage.jsx` (new)
   - `frontend/src/CartPanel.jsx` (new)
5. Leave your backend files and MySQL database as they were. You do **not** need to import SQL or run `npm run seed`.
6. In XAMPP, start MySQL. From the `backend/` folder, run `npm run dev`.
7. From the `frontend/` folder, run `npm install` (only if necessary), then `npm run build` and `npm run dev`.
8. Open `http://localhost:5173`.

## Expected user flow

1. Open the site: the public homepage shows storytelling content but **no product cards**.
2. Click **Customer login** or **Explore the store** and log in using a customer account.
3. The dedicated store opens on **Shop products**.
4. Click **My cart** in the sidebar to manage quantities and submit an order.
5. Click **Delivery details** to save/edit your address before checkout.
6. Click **My orders** to see order status, using the existing Step 4 backend.
7. Use **My profile** to view your account details.
8. Log out, then sign in with your admin account to confirm the admin inventory and orders dashboard still works.

## Technical notes

- The login token remains in React memory (same as Step 5): refreshing the page signs out of the current frontend view.
- The shopping cart remains browser-local (same as Step 5). Its contents are not reserved until checkout.
- Store sidebar panels are client-side views, not distinct server routes. This means no React Router dependency or XAMPP rewrites are needed.
- Order totals and stock checks remain enforced by the Express API.
- A full Vite build could not be run in the packaging environment because `node_modules` were unavailable and `npm install --offline` could not fetch the required packages. **Please run `npm install` and `npm run build` locally before treating the update as verified.**
