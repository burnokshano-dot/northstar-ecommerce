# Step 7 — Landing page, sticky headers, admin dashboard

This update builds on Step 6. It changes **frontend only** and does not require a SQL migration, a backend route change, or rerunning the product seed.

## Changes

- Public header remains at the top during scrolling. The announcement bar scrolls away; the navigation stays visible.
- Store top bar remains visible while scrolling the store (the store sidebar stays fixed on desktop).
- Landing page has a refined hero, enhanced feature cards, a new four-part shopping experience section, a brand statement panel, and clearer calls to action. Purchasing still happens **only after customer login** on the store page.
- Admin interface now has **Overview**, **Inventory**, and **Orders** navigation so you only see the selected area.
- Admin overview features a welcome banner, live stock KPIs, low-stock alerts, and shortcuts. Inventory retains the existing CRUD and quick stock adjust controls. Orders retains the current status workflow.
- Admin includes a refresh button and mobile-friendly navigation.

## How to install

1. Back up your working Step 6 project.
2. Extract this archive.
3. Replace ONLY these files from the archive in the matching paths of your working project:
   - `frontend/src/App.jsx`
   - `frontend/src/AdminDashboard.jsx`
   - `frontend/src/styles.css`
4. Do not replace `.env` files or import SQL. Keep all other source files as they are.
5. Start MySQL in XAMPP and start the backend (`cd backend && npm run dev`).
6. In another terminal: `cd frontend && npm install && npm run build && npm run dev`.
7. Open http://localhost:5173.

## Verify

- Scroll the landing page; the header remains visible.
- The landing page allows login/register but does not expose a checkout.
- Login as customer: the store opens, its top bar stays visible as you scroll, and cart/address/orders remain separate.
- Login as admin: switch between Overview, Inventory, Orders; add/edit a product, adjust stocks and test an order status change.
- Use the Refresh button; check low-stock alerts show the same products as the inventory list.
- Check narrow viewport/mobile layout, including admin sign out.

## Development notes

No database schema changes. No payment or shipping integration changes. This project uses externally hosted Unsplash example images (internet needed to render them). Full Vite compilation could not be verified in the authoring environment because npm installation timed out. Run `npm run build` on your machine and share the exact error if it fails.
