# ShopVault — Premium E-Commerce Platform

A full-stack e-commerce application with a luxury dark aesthetic, built with Express.js and vanilla JavaScript.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: JSON file-based storage (no native compilation needed)
- **Auth**: JWT tokens + bcrypt password hashing
- **Frontend**: Vanilla HTML/CSS/JS (Single Page Application)

## Features

- **Product Listings** — Grid with category filters, sort by price/rating, search
- **Product Detail Page** — Image, description, quantity selector, add to cart
- **Shopping Cart** — Slide-out drawer, qty controls, real-time totals
- **User Registration / Login** — JWT auth, persisted session
- **Checkout** — Shipping + payment form, order processing
- **Order History** — View past orders in account dashboard
- **Premium UI** — Dark luxury aesthetic, smooth animations, responsive

## Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Start the server
```bash
node server.js
```

### 3. Open in browser
```
http://localhost:3000
```

## Project Structure

```
ecommerce/
├── backend/
│   ├── server.js        # Express API + static serving
│   ├── db.json          # Auto-created on first use
│   └── package.json
└── frontend/
    ├── index.html       # SPA shell
    ├── css/
    │   └── main.css     # All styles
    └── js/
        └── app.js       # SPA router + all UI logic
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/products | — | List products (filter/sort/search) |
| GET | /api/products/:id | — | Single product |
| GET | /api/categories | — | All categories |
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Sign in, get JWT |
| GET | /api/auth/me | ✓ | Current user |
| POST | /api/orders | ✓ | Place order |
| GET | /api/orders | ✓ | My order history |

## Design System

- **Font**: Cormorant Garamond (display) + DM Sans (body) + DM Mono (data)
- **Colors**: Deep black `#0e0d0b`, Gold accent `#c9a96e`, Off-white `#f0ece4`
- **Style**: Luxury editorial dark theme with micro-interactions
