# 🛍️ ATELIER — Modern E-Commerce & Private B2B Wholesale Template

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4?logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?logo=mysql&logoColor=white)](https://mysql.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Hostinger Ready](https://img.shields.io/badge/Hostinger-Production%20Ready-673AB7)](https://hostinger.com)

A turnkey, production-ready **Apparel E-Commerce & Private B2B Wholesale Platform** built with high-performance vanilla web technologies. Designed for streetwear brands, fashion labels, and apparel manufacturers who need both a luxury retail storefront and a private, gated wholesale portal with MOQ enforcement and margin protection.

---

## 🌟 Key Features

### 1. 🛒 Luxury Retail Storefront
- **High-Converting UI**: Clean editorial aesthetics, micro-animations, and fluid responsive design.
- **Interactive Product Pages**: Live colorway previews, size selectors, dynamic stock indicators, and instant zoom.
- **Slide-out Cart & Wishlist**: Persistent cart drawer, quick-add functionality, and local storage sync.
- **Order Checkout**: Multi-step checkout supporting Cash on Delivery (COD) and Bank Transfer.
- **WhatsApp Cloud API**: Automated order confirmation messages sent directly to customers.

### 2. 💼 Private B2B Wholesale Portal (`/wholesale.html`)
- **Gated Access & Authentication**: Multi-step reseller application form with admin approval workflow.
- **Role-Based Server Authorization**: Strict access control (`wholesale_customer`, `wholesale_applicant`, `admin`).
- **Starter Pack & MOQ Enforcement**: Imposes complete size breakdown (`S`, `M`, `L`, `XL`) across all colorways before order validation.
- **Dynamic 3-Tier Volume Pricing Engine**:
  - **MOQ** : Initial baseline tier as soon as the Starter Pack is reached (35% target margin).
  - **Palier 2 (MOQ-49)** : Mid-volume pricing for 25 to 49 pieces (30% target margin).
  - **Palier 3 (50+)** : High-volume wholesale rate for 50+ units (25% target margin).
- **Cost-Based Pricing & Margin Floor Protection**: Guarantees merchant profitability with a 20% absolute margin floor safeguard:
  $$\text{Wholesale Price} = \max\left(\left\lceil \frac{\text{Unit Cost}}{1 - \text{Target Margin}} \right\rceil, \left\lceil \frac{\text{Unit Cost}}{1 - 0.20} \right\rceil\right)$$
- **Dual Floating Order Bars**: Top bulk order bar placed right below tier chips + elevated sticky bottom bar for effortless checkout.

### 3. ⚡ Admin Management Dashboard (`/admin.html`)
- **Product & Catalog Manager**: Live product creation, variant management, pricing, and disk/DB synchronization.
- **B2B Configuration Grid**: Unit production cost control, manual MOQ overrides, and margin targets.
- **Wholesale CRM**: Review reseller applications, update status (`approved`, `more_info_required`, `rejected`, `suspended`), and attach internal notes.
- **Order Tracking**: Combined overview of retail orders and wholesale bulk orders.

---

## 📁 Repository Structure

```
├── .htaccess                   # Apache URL rewriting, clean URLs, Gzip & caching policy
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules (credentials, OS files, node_modules)
├── README.md                   # Project documentation
├── package.json                # Node.js dev server configuration
├── server.js                   # Zero-dependency local Node.js development server
├── wholesale-server.js         # Local Node.js wholesale API handler
│
├── api/                        # PHP RESTful Backend (Hostinger / cPanel / Apache / Nginx)
│   ├── config.example.php      # Database credentials template
│   ├── db.php                  # PDO MySQL connection & auto-table creation
│   ├── migrate-db.php          # 1-click database migration & seed endpoint
│   ├── wholesale.php           # B2B authentication, pricing engine, orders & catalog API
│   ├── orders.php              # Retail checkout & order management API
│   ├── sync-all.php            # Catalog disk & MySQL synchronization endpoint
│   ├── contact.php             # Contact form submission API
│   ├── newsletter.php          # Newsletter subscriber API
│   ├── upload-image.php        # Product image upload API
│   └── whatsapp.php            # WhatsApp Business API integration
│
├── assets/
│   ├── css/                    # Modular vanilla stylesheets (variables, components, pages, wholesale)
│   ├── js/
│   │   ├── config.js           # Client configuration (API endpoints, brand info)
│   │   ├── core/               # Utilities, cart engine, wishlist, storage
│   │   ├── components/         # Header, footer, cart drawer, toast notifications
│   │   ├── pages/              # Wholesale controller, admin dashboard, product logic
│   │   └── data/               # Canonical JSON datasets (users, products, config, orders)
│   └── images/                 # Product photography, lookbook, branding assets
│
└── *.html                      # Clean semantic HTML pages (index, shop, wholesale, admin, cart, etc.)
```

---

## 🚀 Quick Start Guide

You can run this project locally using either **PHP + MySQL** or the zero-dependency **Node.js dev server**.

### Option A: Standard PHP + MySQL (Recommended for Production & Local PHP)

1. **Clone or Download the repository**:
   ```bash
   git clone https://github.com/your-username/atelier-ecommerce-template.git
   cd atelier-ecommerce-template
   ```

2. **Configure Database**:
   Copy the database template and fill in your MySQL credentials:
   ```bash
   cp api/config.example.php api/config.php
   ```
   Edit `api/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_database_user');
   define('DB_PASS', 'your_database_password');
   ```

3. **Start PHP Local Server**:
   ```bash
   php -S localhost:8000
   ```

4. **Initialize Database Tables & Seed Data**:
   Open your browser and navigate to:
   ```
   http://localhost:8000/api/migrate-db.php
   ```
   This will automatically create all tables and populate wholesale users, starter pack configurations, and the catalog into MySQL.

---

### Option B: Zero-Dependency Node.js Local Server

If you prefer testing without configuring PHP/MySQL immediately:

1. **Start the local server**:
   ```bash
   npm start
   # Server runs at http://localhost:5500
   ```

2. **Open in browser**:
   - Storefront: `http://localhost:5500`
   - Wholesale Portal: `http://localhost:5500/wholesale.html`
   - Admin Dashboard: `http://localhost:5500/admin.html`

---

## 🗄️ Database Schema (`MySQL`)

The platform includes automated table provisioning via `api/db.php`:

| Table Name | Description |
| :--- | :--- |
| **`wholesale_users`** | B2B grossiste accounts, hashed credentials, business info, and approval status |
| **`wholesale_settings`** | Wholesale margins, tier volume thresholds, and unit production costs |
| **`wholesale_orders`** | B2B bulk orders with line items, tiered discounts, and shipping addresses |
| **`wholesale_sessions`**| Cryptographic authorization tokens with expiry timestamps |
| **`catalog_products`** | Master apparel catalog items, variants, colorways, and retail prices |
| **`orders`** | Public retail consumer checkout orders |
| **`newsletter_subscribers`** | Email subscriber list |
| **`contact_messages`** | Customer contact form inquiries |

---

## ☁️ Deploying to Production (Hostinger / cPanel / Shared Hosting)

1. Upload all project files to your server's document root (e.g. `public_html/`).
2. Create a MySQL database and user in your hosting control panel (hPanel / cPanel).
3. Create `api/config.php` (or set environment variables `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).
4. Access `https://your-domain.com/api/migrate-db.php` in your browser once to initialize all database tables and seed master data.
5. Your store and B2B portal are now live and fully operational!

---

## 🔑 Default Accounts (Demo / Initial Seed)

- **Administrator**:
  - Email: `admin@atelier.ma`
  - Access: Full access to `/admin.html` and B2B settings
- **Approved Wholesale Customer**:
  - Email: `buyer@conceptstore.ma`
  - Access: Access to the gated wholesale catalog on `/wholesale.html`

---

## 🛠️ Customization & Branding

- **Store Name & Metadata**: Update title tags in `*.html` and `assets/js/config.js`.
- **Styling & Color Palette**: Modify design tokens in `assets/css/base.css` (`--color-primary`, `--color-accent`, etc.).
- **Product Catalog**: Add or edit items directly in `/admin.html` or update `assets/js/data/products.js`.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details. Free for personal and commercial use.
