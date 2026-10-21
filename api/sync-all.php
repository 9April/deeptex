<?php
/**
 * ATELIER E-Commerce - Catalog Disk Sync API Endpoint
 * Writes updated products, categories, and colors to persistent JS data files on disk.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
if (empty($rawInput)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Empty request body']);
    exit;
}

$payload = json_decode($rawInput, true);
if (!$payload) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

require_once __DIR__ . '/db.php';

$rootDir = dirname(__DIR__);
$synced = [];

// 1. Sync Products
if (!empty($payload['products']) && is_array($payload['products'])) {
    $productsFilePath = $rootDir . '/assets/js/data/products.js';
    
    // Read existing file to preserve aliases and reconciliation logic
    $existing = file_exists($productsFilePath) ? file_get_contents($productsFilePath) : '';
    
    $incomingProducts = $payload['products'];
    $deletedId = !empty($payload['deletedProductId']) ? $payload['deletedProductId'] : null;

    // Safety guard: Parse disk products and merge by ID so that partial saves NEVER drop other catalog items
    if (preg_match('/window\.DEFAULT_STORE_PRODUCTS\s*=\s*(\[[\s\S]*?\]);\s*\n/u', $existing, $m)) {
        $diskProducts = json_decode($m[1], true);
        if (is_array($diskProducts) && !empty($diskProducts)) {
            $incomingById = [];
            foreach ($incomingProducts as $p) {
                if (!empty($p['id'])) {
                    $incomingById[$p['id']] = $p;
                }
            }

            $mergedProducts = [];
            $seenIds = [];

            // 1. Update or retain existing disk products
            foreach ($diskProducts as $diskP) {
                $id = $diskP['id'] ?? '';
                if ($id === $deletedId) {
                    continue; // explicitly deleted
                }
                if (isset($incomingById[$id])) {
                    $mergedProducts[] = $incomingById[$id];
                    $seenIds[$id] = true;
                } else {
                    $mergedProducts[] = $diskP;
                    $seenIds[$id] = true;
                }
            }

            // 2. Append any brand new products from incoming payload
            foreach ($incomingProducts as $incP) {
                $id = $incP['id'] ?? '';
                if (!empty($id) && !isset($seenIds[$id]) && $id !== $deletedId) {
                    $mergedProducts[] = $incP;
                    $seenIds[$id] = true;
                }
            }

            $incomingProducts = $mergedProducts;
        }
    }

    $productsJson = json_encode($incomingProducts, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    
    $jsContent = "/**\n * Products Master Database\n * Fully data-driven, expandable apparel catalog.\n */\n\n";
    $jsContent .= "window.DEFAULT_STORE_PRODUCTS = " . $productsJson . ";\n\n";
    
    // Extract aliases & reconciliation from existing file if available
    $aliasPos = strpos($existing, 'window.DEPRECATED_PRODUCT_IDS');
    if ($aliasPos !== false) {
        $jsContent .= substr($existing, $aliasPos);
    } else {
        $jsContent .= "window.STORE_PRODUCTS = window.DEFAULT_STORE_PRODUCTS;\n";
    }

    if (file_put_contents($productsFilePath, $jsContent) !== false) {
        $synced[] = 'products (' . count($incomingProducts) . ')';
        // Also persist JSON backup
        @file_put_contents($rootDir . '/assets/js/data/products_canonical.json', $productsJson);
    }

    // Also persist into MySQL catalog_products table
    try {
        $pdo = getDbConnection();
        initDbTables($pdo);
        $stmt = $pdo->prepare("
            REPLACE INTO `catalog_products` (`id`, `name`, `slug`, `category`, `price`, `data_json`, `updated_at`)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        foreach ($incomingProducts as $p) {
            $pId = $p['id'] ?? '';
            if (empty($pId)) continue;
            $stmt->execute([
                $pId,
                $p['name'] ?? '',
                $p['slug'] ?? $pId,
                $p['category'] ?? 't-shirts',
                (int)($p['price'] ?? 0),
                json_encode($p, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            ]);
        }
        if (!empty($deletedId)) {
            $delStmt = $pdo->prepare("DELETE FROM `catalog_products` WHERE `id` = ?");
            $delStmt->execute([$deletedId]);
        }
        $synced[] = 'database catalog_products synced';
    } catch (Exception $e) {
        error_log("DB catalog sync notice: " . $e->getMessage());
    }
}

// 2. Sync Categories
if (!empty($payload['categories']) && is_array($payload['categories'])) {
    $categoriesJson = json_encode($payload['categories'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $catFilePath = $rootDir . '/assets/js/data/categories.js';
    
    $catContent = "/**\n * Categories Master Data\n */\n\n";
    $catContent .= "window.DEFAULT_STORE_CATEGORIES = " . $categoriesJson . ";\n\n";
    $catContent .= "(function() {\n  try {\n    const saved = localStorage.getItem(\"atelier_categories_v1\");\n    if (saved) {\n      window.STORE_CATEGORIES = JSON.parse(saved);\n      return;\n    }\n  } catch (e) {}\n  window.STORE_CATEGORIES = window.DEFAULT_STORE_CATEGORIES;\n})();\n";

    if (file_put_contents($catFilePath, $catContent) !== false) {
        $synced[] = 'categories (' . count($payload['categories']) . ')';
    }
}

// 3. Sync Specific Code/Asset Files (HTML, CSS, JS, JSON, PHP)
if (!empty($payload['files']) && is_array($payload['files'])) {
    foreach ($payload['files'] as $relPath => $content) {
        $cleanPath = ltrim(str_replace(['../', '..\\'], '', $relPath), '/');
        $ext = strtolower(pathinfo($cleanPath, PATHINFO_EXTENSION));
        if (!in_array($ext, ['html', 'css', 'js', 'json', 'php'])) {
            continue;
        }
        $fullPath = $rootDir . '/' . $cleanPath;
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (file_put_contents($fullPath, $content) !== false) {
            $synced[] = 'file: ' . $cleanPath;
        }
    }
}

echo json_encode([
    'success' => true,
    'synced' => $synced,
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
]);
