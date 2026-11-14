# STEP 2 — Admin dashboard + inventory management

This is the COMPLETE Step 1 project with Step 2 changes already applied. **Keep your existing XAMPP database**; the schema is unchanged. Do not import a new database or re-run the seed command, because that is unnecessary for this update.

## Copy updated files into your existing project

1. Extract the ZIP.
2. In your original `ecommerce-starter` folder, replace these files with the files from the extracted folder:
   - `backend/src/server.js`
   - `backend/src/adminRoutes.js` **(new)**
   - `frontend/src/App.jsx`
   - `frontend/src/AdminDashboard.jsx` **(new)**
   - `frontend/src/styles.css`
3. Leave your original `backend/.env` file unchanged. It contains your local database settings and secret.
4. Leave your XAMPP `northstar_shop` database intact — no import is required for Step 2.

Alternatively, work from the extracted copy, but you must copy your original `backend/.env` into the new copy. `backend/.env` is not included in the ZIP for your security.

## Start the system

Make sure XAMPP MySQL is running. In the **backend** folder:

```bash
npm install
npm run dev
```

In a **second terminal**, from the **frontend** folder:

```bash
npm install
npm run dev
```

Open http://localhost:5173. Click **Admin login**, enter `admin` / `admin123` (local development only). You will be sent to the dashboard.

## Test checklist

1. The dashboard shows totals for active products, units, low-stock items, and inventory value.
2. Click **Add product**, enter name, category, price, stock and image URL; save. The new product should appear in the table.
3. Click the pencil next to a product; edit its price and stock; save.
4. Click `+` or `−` in the Quick Adjust column to update stock by one, with no negative stock allowed.
5. Use the search bar and **Low stock only** checkbox.
6. Click the trash icon; confirm; the product disappears from the storefront (soft delete — its database history remains).
7. Click **View storefront**. Products and quantities should reflect the changes.
8. Click **Admin dashboard** to return or **Sign out** to end the in-memory login session.

## New API routes (admin-only)

All routes use `Authorization: Bearer <JWT>` and require the admin role:

- `GET /api/admin/summary`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `PATCH /api/admin/products/:id/stock` with JSON body `{ "change": 1 }` or `{ "change": -1 }`
- `DELETE /api/admin/products/:id` (soft delete)

Example product JSON: `{ "name": "Ceramic Cup", "category": "Home", "description": "Minimal cup", "price": 299.00, "stock": 12, "image_url": "https://images.unsplash.com/photo-example" }` (replace the placeholder with a real image URL).

## What is still planned

Step 3 adds customer login/registration, cart, and Philippine province/city/barangay delivery address forms. Step 4 adds actual orders, stock deductions on checkout, and admin order controls. Step 5 covers testing and GitHub publishing. Do not deploy publicly with demo `admin123` credentials: change the password, update the JWT secret, configure CORS, HTTPS, and add authentication rate limiting first.
