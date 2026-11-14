# Step 5 — Testing, polish, and GitHub readiness

## Upgrade without losing data
1. Back up `northstar_shop` in phpMyAdmin first.
2. Copy updated Step 5 project files into your existing project. **Keep `backend/.env`, `frontend/.env` if present, and the existing MySQL database**.
3. No migration is required. Do not re-import `schema.sql` and do not run `npm run seed`.
4. Start XAMPP MySQL; run `npm run dev` in each of the `backend` and `frontend` folders.

## What's improved
- Development admin password is no longer printed in the storefront login dialog.
- Customer order history receives a refresh signal after successful checkout.
- Shared backend order validation and status-transition logic is covered by Node built-in unit tests.
- GitHub Actions workflow runs tests and builds on each push.
- GitHub-ready `.gitignore`, release documentation, and setup instructions.

## Run automated checks
```bash
cd backend
npm install
npm run check
npm test
```
Then in another terminal:
```bash
cd frontend
npm install
npm run build
```
The frontend build generates `frontend/dist/` (ignored by Git).

## Manual acceptance test (use dummy accounts and fake addresses only)
- [ ] `/api/health` reports a connected database.
- [ ] Customer can register and login. Admin cannot access customer-only APIs; customer cannot access admin-only APIs.
- [ ] Customer saves an address and sees it after navigating away and back.
- [ ] Cart supports add, quantity change, and remove.
- [ ] Placing an order with valid stock saves a pending order and deducts stock exactly once.
- [ ] Repeating the same checkout request key does not create a duplicate order.
- [ ] Attempting to buy more items than available returns an error and does not reduce stock.
- [ ] Customer sees the new order in order history after checkout.
- [ ] Admin confirms then ships then delivers an order.
- [ ] Admin cancels a second pending order and its stock is restored exactly once.
- [ ] Products can be added, edited, hidden, and adjusted from admin dashboard.
- [ ] No `.env`, secret token, or real customer export appears in Git files.

## GitHub
See `GITHUB-UPLOAD.md` after all tests pass. GitHub publication is not performed by this ZIP.
