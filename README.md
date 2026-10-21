# ATELIER — Modern E-Commerce & Private B2B Wholesale Template

A turnkey, production-ready **Apparel E-Commerce & Private B2B Wholesale Platform** built with high-performance vanilla web technologies. Designed for streetwear brands, fashion labels, and apparel manufacturers who need both a luxury retail storefront and a private, gated wholesale portal with MOQ enforcement and margin protection.

---

## 1. Luxury Retail Storefront

- **High-Converting UI:** Clean editorial aesthetics, micro-animations, and fluid responsive design.
- **Interactive Product Pages:** Live colorway previews, size selectors, dynamic stock indicators, and instant zoom.
- **Slide-out Cart & Wishlist:** Persistent cart drawer, quick-add functionality, and local storage synchronization.
- **Order Checkout:** Multi-step checkout supporting Cash on Delivery (COD) and bank transfer.
- **WhatsApp Cloud API:** Automated order confirmation messages sent directly to customers.

## 2. Private B2B Wholesale Portal (`/wholesale.html`)

- **Gated Access & Authentication:** Multi-step reseller application form with an admin approval workflow.
- **Role-Based Server Authorization:** Strict access control (`wholesale_customer`, `wholesale_applicant`, `admin`).
- **Starter Pack & MOQ Enforcement:** Requires a complete size breakdown (`S`, `M`, `L`, `XL`) across all colorways before order validation.
- **Dynamic Three-Tier Volume Pricing Engine:**
  - **MOQ:** Initial pricing tier activated when the starter pack requirement is met, targeting a 35% margin.
  - **Tier 2 (25–49 units):** Mid-volume pricing targeting a 30% margin.
  - **Tier 3 (50+ units):** High-volume wholesale pricing targeting a 25% margin.
- **Cost-Based Pricing & Margin Protection:** Enforces a minimum margin of 20%.

  Wholesale pricing formula:

  \[
  P = \max\left(
  \left\lceil\frac{C}{1-M}\right\rceil,
  \left\lceil\frac{C}{1-0.20}\right\rceil
  \right)
  \]

  Where:
  - \(P\) = Wholesale unit price
  - \(C\) = Unit production cost
  - \(M\) = Target margin

- **Dual Floating Order Bars:** Bulk order bar positioned below the pricing tiers and a sticky bottom bar for convenient checkout.

## 3. Admin Management Dashboard (`/admin.html`)

- **Product & Catalog Manager:** Product creation, variant management, pricing, and file/database synchronization.
- **B2B Configuration Grid:** Unit production cost control, manual MOQ overrides, and margin targets.
- **Wholesale CRM:** Review reseller applications, update application status (`approved`, `more_info_required`, `rejected`, `suspended`), and attach internal notes.
- **Order Tracking:** Combined overview of retail orders and wholesale bulk orders.

---

## 4. Repository Structure

```text
├── .htaccess                   # Apache URL rewriting, clean URLs, Gzip and caching
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
├── package.json                # Node.js development server configuration
├── server.js                   # Local Node.js development server
├── wholesale-server.js         # Local Node.js wholesale API handler
│
├── api/                        # PHP RESTful backend
│   ├── config.example.php      # Database credentials template
│   ├── db.php                  # PDO MySQL connection and table creation
│   ├── migrate-db.php          # Database migration and seed endpoint
│   ├── wholesale.php           # B2B authentication, pricing, orders and catalog API
│   ├── orders.php              # Retail checkout and order management API
│   ├── sync-all.php            # Catalog synchronization endpoint
│   ├── contact.php             # Contact form submission API
│   ├── newsletter.php          # Newsletter subscriber API
│   ├── upload-image.php        # Product image upload API
│   └── whatsapp.php            # WhatsApp Business API integration
│
├── assets/
│   ├── css/                    # Modular stylesheets
│   ├── js/
│   │   ├── config.js           # API endpoints and brand configuration
│   │   ├── core/               # Utilities, cart engine, wishlist and storage
│   │   ├── components/         # Header, footer, cart drawer and notifications
│   │   ├── pages/              # Wholesale controller, admin dashboard and product logic
│   │   └── data/               # JSON datasets for users, products, configuration and orders
│   └── images/                 # Product photography, lookbook and branding assets
│
└── *.html                      # HTML pages: storefront, shop, wholesale, admin and cart
```

---

## 5. Quick Start Guide

The project can run locally using either PHP and MySQL or the Node.js development server.

### Option A: PHP + MySQL

Recommended for production deployments and local PHP development.

**Step 1: Clone or download the repository**

```bash
git clone https://github.com/your-username/atelier-ecommerce-template.git
cd atelier-ecommerce-template
```

**Step 2: Configure the database**

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

**Step 3: Start the PHP development server**

```bash
php -S localhost:8000
```

**Step 4: Initialize database tables and seed data**

Open the following URL in your browser:

```text
http://localhost:8000/api/migrate-db.php
```

This endpoint initializes the database tables and populates the initial wholesale users, starter pack configurations, and catalog data.

### Option B: Node.js Development Server

Use this option to test the storefront without immediately configuring PHP and MySQL.

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
- Wholesale Portal: `http://localhost:5500/wholesale.html`
- Admin Dashboard: `http://localhost:5500/admin.html`

Note: The Node.js development server does not necessarily provide the same functionality as the PHP/MySQL production backend.

---

## 6. Database Schema (`MySQL`)

The platform includes automated table provisioning through `api/db.php`.

| Table Name | Description |
|---|---|
| `wholesale_users` | Wholesale accounts, hashed credentials, business information, and approval status |
| `wholesale_settings` | Wholesale margins, volume thresholds, and unit production costs |
| `wholesale_orders` | Bulk orders, line items, tiered pricing, and shipping addresses |
| `wholesale_sessions` | Authorization tokens with expiration timestamps |
| `catalog_products` | Apparel catalog items, variants, colorways, and retail prices |
| `orders` | Retail checkout orders |
| `newsletter_subscribers` | Newsletter subscriber records |
| `contact_messages` | Customer contact form inquiries |

---

## 7. Production Deployment — Hostinger, cPanel, or Shared Hosting

1. Upload the project files to your hosting document root, such as `public_html/`.
2. Create a MySQL database and database user through your hosting control panel.
3. Create `api/config.php` with the correct database credentials, or configure the supported environment variables.
4. Configure the production environment and verify that the PHP backend can connect to the database.
5. Initialize the database using a secured migration procedure.
6. Test storefront browsing, customer checkout, wholesale authentication, pricing calculations, and administrative access.
7. Verify that all sensitive configuration files and administrative endpoints are protected before making the website publicly accessible.

The application is ready for production only after the backend, database, authentication, and deployment security have been tested.

---

## 8. Default Accounts — Demo Configuration

The following accounts are intended for initial development or seeded demo data.

**Administrator**
- Email: `admin@atelier.ma`
- Access: Admin dashboard and wholesale configuration.

**Approved Wholesale Customer**
- Email: `buyer@conceptstore.ma`
- Access: Restricted wholesale catalog.

These are example account identifiers. Configure secure credentials before deployment. Never publish default passwords or expose administrative accounts in a live environment.

---

## 9. Customization & Branding

- **Store Name & Metadata:** Update the title tags in the HTML files and brand configuration in `assets/js/config.js`.
- **Styling & Color Palette:** Modify design tokens in `assets/css/base.css`, including `--color-primary` and `--color-accent`.
- **Product Catalog:** Manage products through the admin dashboard or update the relevant product data files.
- **Wholesale Configuration:** Adjust production costs, minimum order quantities, pricing tiers, and target margins through the appropriate configuration settings.

---

## 10. License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

Free for personal and commercial use, subject to the terms of the license.
