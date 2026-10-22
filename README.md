# ATELIER — Modern Luxury Apparel E-Commerce Platform

A turnkey, production-ready **Apparel E-Commerce Platform** built with high-performance vanilla web technologies. Designed for streetwear brands, fashion labels, and apparel studios who need a high-converting retail storefront and an inventory management and order control dashboard.

---

## 1. Luxury Retail Storefront

- **High-Converting UI:** Clean editorial aesthetics, micro-animations, and fluid responsive design.
- **Interactive Product Pages:** Live colorway previews, size selectors, dynamic stock indicators, and instant zoom.
- **Slide-out Cart & Wishlist:** Persistent cart drawer, quick-add functionality, and local storage synchronization.
- **Order Checkout:** Multi-step checkout supporting Cash on Delivery (COD) and bank transfer.
- **WhatsApp Cloud API:** Automated order confirmation messages sent directly to customers.

## 2. Admin Management Dashboard (`/admin.html`)

- **Product & Catalog Manager:** Product creation, variant management, pricing, customizable bundles/packs, and file/database synchronization.
- **Inventory & Stock Matrix:** Real-time stock status across all SKUs, colors, and sizes with low-stock alerts.
- **Order Tracking (MySQL Live DB):** Live order status management, customer details, and items fulfillment.
- **WhatsApp Meta Integration:** Automated order confirmations configuration and instant testing.

---

## 3. Repository Structure

```text
├── .htaccess                   # Apache URL rewriting, clean URLs, Gzip and caching
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
├── package.json                # Node.js development server configuration
├── server.js                   # Local Node.js development server
│
├── api/                        # PHP RESTful backend
│   ├── config.example.php      # Database credentials template
│   ├── db.php                  # PDO MySQL connection and table creation
│   ├── migrate-db.php          # Database migration and seed endpoint
│   ├── orders.php              # Retail checkout and order management API
│   ├── sync-all.php            # Catalog synchronization endpoint
│   ├── contact.php             # Contact form submission API
│   ├── newsletter.php          # Newsletter subscriber API
│   ├── upload-image.php        # Product image upload API
│   └── whatsapp.php            # WhatsApp Business API integration
│
├── assets/
│   ├── css/                    # Modular stylesheets (base, components, admin, pages)
│   ├── js/
│   │   ├── config.js           # API endpoints and brand configuration
│   │   ├── core/               # Utilities, cart engine, wishlist and storage
│   │   ├── components/         # Header, footer, cart drawer and notifications
│   │   ├── pages/              # Admin dashboard and product logic
│   │   └── data/               # JSON datasets for products, categories, collections and orders
│   └── images/                 # Product photography, lookbook and branding assets
│
└── *.html                      # HTML pages: storefront, shop, product, admin and cart
```

---

## 4. Quick Start Guide

The project can run locally using either PHP and MySQL or the Node.js development server.

### Option A: PHP + MySQL

Recommended for production deployments and local PHP development.

**Step 1: Configure the database**

Copy the database configuration template:

```bash
cp api/config.example.php api/config.php
```

Edit `api/config.php` and enter your MySQL credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');
```

**Step 2: Start the PHP development server**

```bash
php -S localhost:8000
```

**Step 3: Initialize database tables and seed data**

Open the following URL in your browser:

```text
http://localhost:8000/api/migrate-db.php
```

This endpoint initializes the database tables and populates the catalog data.

### Option B: Node.js Development Server

Use this option to test the storefront and admin without configuring PHP and MySQL.

**Step 1: Start the server**

```bash
npm start
```

The server runs at:

```text
http://localhost:5500
```

**Step 2: Open the application**

- Storefront: `http://localhost:5500`
- Shop: `http://localhost:5500/shop.html`
- Admin Dashboard: `http://localhost:5500/admin.html`

---

## 5. Database Schema (`MySQL`)

The platform includes automated table provisioning through `api/db.php`.

| Table Name | Description |
|---|---|
| `catalog_products` | Apparel catalog items, variants, colorways, and retail prices |
| `orders` | Retail checkout orders |
| `newsletter_subscribers` | Newsletter subscriber records |
| `contact_messages` | Customer contact form inquiries |

---

## 6. Production Deployment — Hostinger, cPanel, or Shared Hosting

1. Upload the project files to your hosting document root, such as `public_html/`.
2. Create a MySQL database and database user through your hosting control panel.
3. Create `api/config.php` with the correct database credentials.
4. Run `http://your-domain.com/api/migrate-db.php` to initialize tables and catalog data.
5. Test storefront browsing, checkout, order notifications, and administrative access.

---

## 7. Customization & Branding

- **Store Name & Metadata:** Update brand configuration in `assets/js/config.js`.
- **Styling & Color Palette:** Modify design tokens in `assets/css/base.css`.
- **Product Catalog:** Manage products and stocks dynamically through the admin dashboard (`admin.html`).

---

## 8. License

Distributed under the **MIT License**.
