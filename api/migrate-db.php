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
    'catalog_products_migrated' => 0,
    'retail_orders_migrated' => 0
];

// 1. Migrate Catalog Products
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

// 2. Migrate Local Retail Orders (if any)
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

// 3. Audit Live Row Counts in Database
$counts = [];
$tables = [
    'catalog_products',
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
