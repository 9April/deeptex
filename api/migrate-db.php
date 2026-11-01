<?php
/**
 * ATELIER E-Commerce - Database Migration & Master Seed Script
 * Connects to MySQL (u895506237_deept), ensures all schemas exist,
 * and seeds/migrates all users, config, orders, and catalog items into MySQL.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

$rootDir = dirname(__DIR__);
$usersFile = $rootDir . '/assets/js/data/wholesale_users.json';
$configFile = $rootDir . '/assets/js/data/wholesale_config.json';
$ordersFile = $rootDir . '/assets/js/data/wholesale_orders.json';
$productsFile = $rootDir . '/assets/js/data/products_canonical.json';
$fallbackProducts = $rootDir . '/assets/js/data/products.js';
$localOrdersFile = $rootDir . '/assets/js/data/local_orders.json';

try {
    $pdo = getDbConnection();
    initDbTables($pdo);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection or initialization failed: ' . $e->getMessage()
    ]);
    exit;
}

$results = [
    'users_migrated' => 0,
    'config_migrated' => false,
    'wholesale_orders_migrated' => 0,
    'catalog_products_migrated' => 0,
    'retail_orders_migrated' => 0
];

// 1. Migrate Wholesale Users
if (file_exists($usersFile)) {
    $users = json_decode(file_get_contents($usersFile), true) ?: [];
    $stmt = $pdo->prepare("
        INSERT INTO `wholesale_users` (
            `id`, `email`, `password_hash`, `salt`, `full_name`, `phone`, `role`,
            `application_status`, `business_name`, `country`, `city`, `business_type`,
            `sales_channel`, `website_social_url`, `estimated_initial_order`,
            `expected_reorder_freq`, `selling_status`, `additional_info`, `admin_notes`,
            `info_request_message`, `applicant_response`, `created_at`, `updated_at`, `approved_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            `full_name` = VALUES(`full_name`),
            `phone` = VALUES(`phone`),
            `role` = VALUES(`role`),
            `application_status` = VALUES(`application_status`),
            `business_name` = VALUES(`business_name`),
            `country` = VALUES(`country`),
            `city` = VALUES(`city`),
            `business_type` = VALUES(`business_type`),
            `sales_channel` = VALUES(`sales_channel`),
            `website_social_url` = VALUES(`website_social_url`),
            `estimated_initial_order` = VALUES(`estimated_initial_order`),
            `expected_reorder_freq` = VALUES(`expected_reorder_freq`),
            `selling_status` = VALUES(`selling_status`),
            `additional_info` = VALUES(`additional_info`),
            `admin_notes` = VALUES(`admin_notes`),
            `info_request_message` = VALUES(`info_request_message`),
            `applicant_response` = VALUES(`applicant_response`),
            `updated_at` = VALUES(`updated_at`),
            `approved_at` = VALUES(`approved_at`)
    ");

    foreach ($users as $u) {
        $stmt->execute([
            $u['id'] ?? null,
            strtolower(trim($u['email'])),
            $u['password_hash'] ?? '',
            $u['salt'] ?? '',
            $u['full_name'] ?? '',
            $u['phone'] ?? '',
            $u['role'] ?? 'wholesale_applicant',
            $u['application_status'] ?? 'pending',
            $u['business_name'] ?? '',
            $u['country'] ?? 'Maroc',
            $u['city'] ?? '',
            $u['business_type'] ?? 'other',
            $u['sales_channel'] ?? '',
            $u['website_social_url'] ?? '',
            $u['estimated_initial_order'] ?? '10-25',
            $u['expected_reorder_freq'] ?? 'monthly',
            $u['selling_status'] ?? 'already_selling',
            $u['additional_info'] ?? '',
            $u['admin_notes'] ?? '',
            $u['info_request_message'] ?? null,
            $u['applicant_response'] ?? null,
            $u['created_at'] ?? gmdate('Y-m-d H:i:s'),
            $u['updated_at'] ?? gmdate('Y-m-d H:i:s'),
            $u['approved_at'] ?? null
        ]);
        $results['users_migrated']++;
    }
}

// 2. Migrate Wholesale Config / Settings
if (file_exists($configFile)) {
    $configContent = file_get_contents($configFile);
    $stmt = $pdo->prepare("
        INSERT INTO `wholesale_settings` (`key_name`, `data_json`, `updated_at`)
        VALUES ('wholesale_config', ?, NOW())
        ON DUPLICATE KEY UPDATE `data_json` = VALUES(`data_json`), `updated_at` = NOW()
    ");
    $stmt->execute([$configContent]);
    $results['config_migrated'] = true;
}

// 3. Migrate Wholesale Orders
if (file_exists($ordersFile)) {
    $wholesaleOrders = json_decode(file_get_contents($ordersFile), true) ?: [];
    $stmt = $pdo->prepare("
        INSERT INTO `wholesale_orders` (
            `id`, `order_number`, `user_id`, `business_name`, `contact_name`,
            `contact_email`, `contact_phone`, `shipping_address`, `shipping_city`,
            `shipping_country`, `tier_applied`, `total_units`, `subtotal`,
            `discount`, `total`, `payment_method`, `order_note`, `status`,
            `items_json`, `created_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            `status` = VALUES(`status`),
            `items_json` = VALUES(`items_json`)
    ");

    foreach ($wholesaleOrders as $o) {
        $shipping = is_array($o['shipping_address'] ?? null) ? $o['shipping_address'] : [];
        $shippingStr = is_string($o['shipping_address'] ?? '') ? $o['shipping_address'] : json_encode($shipping, JSON_UNESCAPED_UNICODE);
        $city = $shipping['city'] ?? ($o['shipping_city'] ?? '');
        $country = $shipping['country'] ?? ($o['shipping_country'] ?? 'Maroc');
        $itemsStr = json_encode($o['items'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $stmt->execute([
            $o['id'] ?? null,
            $o['order_number'],
            $o['user_id'],
            $o['business_name'] ?? '',
            $o['contact_name'] ?? '',
            $o['contact_email'] ?? '',
            $o['contact_phone'] ?? '',
            $shippingStr,
            $city,
            $country,
            $o['tier_applied'] ?? '',
            (int)($o['total_units'] ?? 0),
            (float)($o['subtotal'] ?? 0),
            (float)($o['discount'] ?? 0),
            (float)($o['total'] ?? 0),
            $o['payment_method'] ?? 'Virement Bancaire (B2B)',
            $o['order_note'] ?? '',
            $o['status'] ?? 'pending',
            $itemsStr,
            $o['created_at'] ?? gmdate('Y-m-d H:i:s')
        ]);
        $results['wholesale_orders_migrated']++;
    }
}

// 4. Migrate Catalog Products
$products = [];
if (file_exists($productsFile)) {
    $products = json_decode(file_get_contents($productsFile), true) ?: [];
}
if (empty($products) && file_exists($fallbackProducts)) {
    $content = file_get_contents($fallbackProducts);
    if (preg_match('/window\.DEFAULT_STORE_PRODUCTS\s*=\s*(\[[\s\S]*?\]);\s*\n/u', $content, $m)) {
        $products = json_decode($m[1], true) ?: [];
    }
}

if (!empty($products)) {
    $stmt = $pdo->prepare("
        REPLACE INTO `catalog_products` (`id`, `name`, `slug`, `category`, `price`, `data_json`, `updated_at`)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    foreach ($products as $p) {
        if (empty($p['id'])) continue;
        $stmt->execute([
            $p['id'],
            $p['name'] ?? '',
            $p['slug'] ?? $p['id'],
            $p['category'] ?? 't-shirts',
            (int)($p['price'] ?? 0),
            json_encode($p, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        ]);
        $results['catalog_products_migrated']++;
    }
}

// 5. Migrate Local Retail Orders (if any)
if (file_exists($localOrdersFile)) {
    $localOrders = json_decode(file_get_contents($localOrdersFile), true) ?: [];
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO `orders` (
            `order_number`, `created_at`, `customer_first_name`, `customer_last_name`,
            `customer_email`, `customer_phone`, `shipping_address`, `shipping_apartment`,
            `shipping_city`, `shipping_postal`, `shipping_country`, `payment_method`,
            `subtotal`, `discount`, `shipping_cost`, `total`, `order_note`, `status`, `items_json`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    foreach ($localOrders as $lo) {
        if (empty($lo['order_number']) && empty($lo['id'])) continue;
        $orderNum = $lo['order_number'] ?? ('ORD-' . $lo['id']);
        $cust = $lo['customer'] ?? [];
        $shipping = $lo['shipping'] ?? [];
        $stmt->execute([
            $orderNum,
            $lo['date'] ?? ($lo['created_at'] ?? gmdate('Y-m-d H:i:s')),
            $cust['first_name'] ?? ($lo['customer_first_name'] ?? ''),
            $cust['last_name'] ?? ($lo['customer_last_name'] ?? ''),
            $cust['email'] ?? ($lo['customer_email'] ?? ''),
            $cust['phone'] ?? ($lo['customer_phone'] ?? ''),
            $shipping['address'] ?? ($lo['shipping_address'] ?? ''),
            $shipping['apartment'] ?? ($lo['shipping_apartment'] ?? ''),
            $shipping['city'] ?? ($lo['shipping_city'] ?? ''),
            $shipping['postal'] ?? ($lo['shipping_postal'] ?? ''),
            $shipping['country'] ?? 'Maroc',
            $lo['payment_method'] ?? 'Paiement à la livraison (COD)',
            (float)($lo['subtotal'] ?? 0),
            (float)($lo['discount'] ?? 0),
            (float)($lo['shipping_cost'] ?? 0),
            (float)($lo['total'] ?? 0),
            $lo['order_note'] ?? '',
            $lo['status'] ?? 'pending',
            json_encode($lo['items'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        ]);
        $results['retail_orders_migrated']++;
    }
}

// 6. Audit Live Row Counts in Database
$counts = [];
$tables = [
    'wholesale_users',
    'wholesale_settings',
    'wholesale_orders',
    'catalog_products',
    'wholesale_sessions',
    'orders',
    'newsletter_subscribers',
    'contact_messages'
];

foreach ($tables as $tbl) {
    try {
        $cStmt = $pdo->query("SELECT COUNT(*) AS cnt FROM `{$tbl}`");
        $counts[$tbl] = (int)$cStmt->fetchColumn();
    } catch (Exception $e) {
        $counts[$tbl] = 'error: ' . $e->getMessage();
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Database migration and synchronization successful.',
    'database' => DB_NAME,
    'results' => $results,
    'table_counts' => $counts,
    'timestamp' => gmdate('Y-m-d H:i:s')
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
