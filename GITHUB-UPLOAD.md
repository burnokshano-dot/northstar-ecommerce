# Publish Northstar Shop to GitHub (last step)

This stage **prepares** the repository; nothing is uploaded automatically.

## Before pushing
1. Back up your local XAMPP database. Keep that backup on your computer, **not in GitHub**.
2. Make sure your `backend/.env` is NOT tracked: `git status --short` and `git check-ignore backend/.env`. This command should print `backend/.env`.
3. Do not add private addresses, customer records, passwords, or database exports. The `database/*.sql` files in this project are **schema and migration scripts**, not data dumps.
4. Change the demo admin password (`admin123`) before putting this app online. Publishing source is not the same as deploying a secure public service.

## Git CLI instructions (VS Code terminal, project root)
Create an **empty** private or public repository on https://github.com/new (do not add a README from GitHub). Replace `YOUR_USERNAME` and `YOUR_REPO` below:

```bash
git init
git add .
git status
git commit -m "Release Northstar ecommerce demo"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Authenticate using GitHub's browser or Git Credential Manager. Do not paste access tokens into code or committed files. If the directory is already a git repository, skip `git init`; if `origin` exists, use `git remote -v` instead of adding it again.

## Verify
- Check GitHub repository files: `README.md`, `frontend/`, `backend/`, `database/`, `.github/workflows/checks.yml`.
- Check **Actions** tab for `Project checks`.
- Search the repository for `.env`, `JWT_SECRET=` with a real value, and sensitive data. Only `.env.example` belongs in source control.

## Hosting note
GitHub stores code. It does **not** host the XAMPP/MySQL + Express application for you. A live public deployment requires a Node hosting service, an accessible production MySQL-compatible database, HTTPS, production secrets, and further security improvements.
