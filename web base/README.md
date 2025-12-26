# Cafewaa — Web Frontend

Simple local-demo frontend for a café ordering system.

## Overview
- Static site that simulates users, products, cart, and orders using `localStorage` and a JSON seed (`data/db.json`).
- Admin UI available at `admin.html` for theme and product/user management.
- Theme settings persist via `localStorage` (`cafeTheme`) and the simulated DB.

## Quick Start
1. Open the project folder in your file explorer.
2. Serve or open `index.html` in your browser. For best results use a simple static server (Live Server, `python -m http.server`, etc.) to avoid fetch CORS issues.

Example (from project root):

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000/index.html
```

## Pages
- `index.html` — Landing page
- `menu.html` — Browse products and add to cart
- `cart.html` — View cart and checkout
- `orders.html` — Order history for the current user
- `admin.html` — Admin dashboard (requires admin user)

## Theme Customization
- Open `admin.html` → Theme Customization to change `siteName`, primary and secondary colors.
- Use "Save Theme" to persist changes; they are stored in `localStorage` (`cafeTheme`) and the simulated DB.
- Use "Reset to Default" to restore defaults from `data/db.json`.

Notes:
- Theme variables are CSS custom properties (`--primary-color`, `--secondary-color`). Avoid hard-coded colors to keep the theme consistent.

## Logout Confirmation
- The project uses a custom modal for logout confirmation implemented in `js/auth.js`.

## Data / Defaults
- Seed data and default theme are in `data/db.json`. The `Database` class (`js/database.js`) loads this on first run and persists to `localStorage`.
- To reset the entire app state, clear `localStorage` in your browser or remove the `cafeDB` key.

## Development Tips
- If `fetch` to `data/db.json` fails when opening files with `file://`, run a local server as shown above.
- To create an admin user or inspect data, edit `data/db.json` or manipulate `localStorage` from the browser DevTools.

## Contributing
Small project — feel free to open issues or send PRs. For UI improvements, prefer CSS variables and centralized classes.

---
## Programmer

- Name: MarkJE
- Role: Lead developer / Programmer
- Email: markje0723@gmail.com

