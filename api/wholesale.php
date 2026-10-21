<?php
/**
 * ATELIER E-Commerce - Private Wholesale & B2B API (PHP / Hostinger)
 * Enforces server-side authentication, role authorization, approval status checks,
 * cost-based pricing engine, and 20% margin floor protection.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Wholesale-Token, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';

$rootDir = dirname(__DIR__);
$usersFile = $rootDir . '/assets/js/data/wholesale_users.json';
$configFile = $rootDir . '/assets/js/data/wholesale_config.json';
$ordersFile = $rootDir . '/assets/js/data/wholesale_orders.json';
$sessionsFile = $rootDir . '/assets/js/data/wholesale_sessions.json';
$productsFile = $rootDir . '/assets/js/data/products.js';

$adminSecretKey = getenv('ADMIN_SECRET_KEY') ?: 'atelier-secret-admin-key-2026';

// Database initialization
$pdo = null;
try {
    $pdo = getDbConnection();
    initDbTables($pdo);
} catch (Exception $e) {
    error_log("Wholesale DB connection notice: " . $e->getMessage());
    $pdo = null;
}

// Helper: Read JSON file
function readJsonFile($path, $default = []) {
    if (file_exists($path)) {
        $content = file_get_contents($path);
        $data = json_decode($content, true);
        if ($data !== null) return $data;
    }
    return $default;
}

// Helper: Write JSON file
function writeJsonFile($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    return file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)) !== false;
}

// Unified Database & File Storage Helpers
function dbGetUsers($pdo, $usersFile) {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM `wholesale_users` ORDER BY `id` ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                return array_map(function($r) {
                    $r['id'] = is_numeric($r['id']) ? (int)$r['id'] : $r['id'];
                    return $r;
                }, $rows);
            }
        } catch (Exception $e) {
            error_log("dbGetUsers error: " . $e->getMessage());
        }
    }
    return readJsonFile($usersFile, []);
}

function dbGetUserByEmail($pdo, $email, $usersFile) {
    if (empty($email)) return null;
    $emailLower = strtolower(trim($email));
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM `wholesale_users` WHERE LOWER(`email`) = ? LIMIT 1");
            $stmt->execute([$emailLower]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $row['id'] = is_numeric($row['id']) ? (int)$row['id'] : $row['id'];
                return $row;
            }
        } catch (Exception $e) {
            error_log("dbGetUserByEmail error: " . $e->getMessage());
        }
    }
    $users = readJsonFile($usersFile, []);
    foreach ($users as $u) {
        if (strtolower($u['email'] ?? '') === $emailLower) {
            return $u;
        }
    }
    return null;
}

function dbGetUserById($pdo, $id, $usersFile) {
    if (!$id) return null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM `wholesale_users` WHERE `id` = ? LIMIT 1");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $row['id'] = is_numeric($row['id']) ? (int)$row['id'] : $row['id'];
                return $row;
            }
        } catch (Exception $e) {
            error_log("dbGetUserById error: " . $e->getMessage());
        }
    }
    $users = readJsonFile($usersFile, []);
    foreach ($users as $u) {
        if (($u['id'] ?? null) == $id) {
            return $u;
        }
    }
    return null;
}

function dbSaveUser($pdo, $user, $usersFile) {
    if ($pdo) {
        try {
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
            $stmt->execute([
                $user['id'] ?? null,
                strtolower(trim($user['email'])),
                $user['password_hash'] ?? '',
                $user['salt'] ?? '',
                $user['full_name'] ?? '',
                $user['phone'] ?? '',
                $user['role'] ?? 'wholesale_applicant',
                $user['application_status'] ?? 'pending',
                $user['business_name'] ?? '',
                $user['country'] ?? 'Maroc',
                $user['city'] ?? '',
                $user['business_type'] ?? 'other',
                $user['sales_channel'] ?? '',
                $user['website_social_url'] ?? '',
                $user['estimated_initial_order'] ?? '10-25',
                $user['expected_reorder_freq'] ?? 'monthly',
                $user['selling_status'] ?? 'already_selling',
                $user['additional_info'] ?? '',
                $user['admin_notes'] ?? '',
                $user['info_request_message'] ?? null,
                $user['applicant_response'] ?? null,
                $user['created_at'] ?? gmdate('Y-m-d H:i:s'),
                $user['updated_at'] ?? gmdate('Y-m-d H:i:s'),
                $user['approved_at'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("dbSaveUser error: " . $e->getMessage());
        }
    }
    // Sync JSON
    $users = readJsonFile($usersFile, []);
    $found = false;
    foreach ($users as &$u) {
        if ($u['id'] == $user['id'] || strtolower($u['email']) === strtolower($user['email'])) {
            $u = array_merge($u, $user);
            $found = true;
            break;
        }
    }
    if (!$found) {
        $users[] = $user;
    }
    writeJsonFile($usersFile, $users);
}

function dbSaveSession($pdo, $token, $userId, $expiresAtMs, $sessionsFile) {
    if ($pdo) {
        try {
            $dtExpires = date('Y-m-d H:i:s', (int)($expiresAtMs / 1000));
            $stmt = $pdo->prepare("
                INSERT INTO `wholesale_sessions` (`token`, `user_id`, `expires_at`, `created_at`)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE `expires_at` = VALUES(`expires_at`)
            ");
            $stmt->execute([$token, $userId, $dtExpires]);
        } catch (Exception $e) {
            error_log("dbSaveSession error: " . $e->getMessage());
        }
    }
    $sessions = readJsonFile($sessionsFile, []);
    $sessions[$token] = [
        'user_id' => $userId,
        'created_at' => time() * 1000,
        'expires_at' => $expiresAtMs
    ];
    writeJsonFile($sessionsFile, $sessions);
}

function dbDeleteSession($pdo, $token, $sessionsFile) {
    if ($pdo && $token) {
        try {
            $stmt = $pdo->prepare("DELETE FROM `wholesale_sessions` WHERE `token` = ?");
            $stmt->execute([$token]);
        } catch (Exception $e) {
            error_log("dbDeleteSession error: " . $e->getMessage());
        }
    }
    if ($token) {
        $sessions = readJsonFile($sessionsFile, []);
        unset($sessions[$token]);
        writeJsonFile($sessionsFile, $sessions);
    }
}

function dbGetAuthUser($pdo, $token, $usersFile, $sessionsFile) {
    if (!$token) return null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                SELECT u.* FROM `wholesale_sessions` s
                JOIN `wholesale_users` u ON u.id = s.user_id
                WHERE s.token = ? AND s.expires_at > NOW()
                LIMIT 1
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $user['id'] = is_numeric($user['id']) ? (int)$user['id'] : $user['id'];
                return $user;
            }
        } catch (Exception $e) {
            error_log("dbGetAuthUser error: " . $e->getMessage());
        }
    }
    return getAuthUser($token, $usersFile, $sessionsFile);
}

function dbGetConfig($pdo, $configFile) {
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT `data_json` FROM `wholesale_settings` WHERE `key_name` = 'wholesale_config' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && !empty($row['data_json'])) {
                $cfg = json_decode($row['data_json'], true);
                if (is_array($cfg) && !empty($cfg)) return $cfg;
            }
        } catch (Exception $e) {
            error_log("dbGetConfig error: " . $e->getMessage());
        }
    }
    return readJsonFile($configFile, []);
}

function dbSaveConfig($pdo, $config, $configFile) {
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `wholesale_settings` (`key_name`, `data_json`, `updated_at`)
                VALUES ('wholesale_config', ?, NOW())
                ON DUPLICATE KEY UPDATE `data_json` = VALUES(`data_json`), `updated_at` = NOW()
            ");
            $stmt->execute([json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]);
        } catch (Exception $e) {
            error_log("dbSaveConfig error: " . $e->getMessage());
        }
    }
    writeJsonFile($configFile, $config);
}

function dbSaveOrder($pdo, $order, $ordersFile) {
    if ($pdo) {
        try {
            $shippingJson = is_array($order['shipping_address'] ?? null) ? $order['shipping_address'] : [];
            $shippingText = is_string($order['shipping_address'] ?? '') ? $order['shipping_address'] : json_encode($shippingJson, JSON_UNESCAPED_UNICODE);
            $city = $shippingJson['city'] ?? ($order['shipping_city'] ?? '');
            $country = $shippingJson['country'] ?? ($order['shipping_country'] ?? 'Maroc');
            $itemsJson = json_encode($order['items'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

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
            $stmt->execute([
                $order['id'] ?? null,
                $order['order_number'],
                $order['user_id'],
                $order['business_name'] ?? '',
                $order['contact_name'] ?? '',
                $order['contact_email'] ?? '',
                $order['contact_phone'] ?? '',
                $shippingText,
                $city,
                $country,
                $order['tier_applied'] ?? '',
                $order['total_units'] ?? 0,
                $order['subtotal'] ?? 0,
                $order['discount'] ?? 0,
                $order['total'] ?? 0,
                $order['payment_method'] ?? 'Virement Bancaire (B2B)',
                $order['order_note'] ?? '',
                $order['status'] ?? 'pending',
                $itemsJson,
                $order['created_at'] ?? gmdate('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("dbSaveOrder error: " . $e->getMessage());
        }
    }
    $orders = readJsonFile($ordersFile, []);
    array_unshift($orders, $order);
    writeJsonFile($ordersFile, $orders);
}

function dbGetProducts($pdo, $rootDir, $productsFile) {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT `data_json` FROM `catalog_products` ORDER BY `id` ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                $prods = [];
                foreach ($rows as $r) {
                    $item = json_decode($r['data_json'], true);
                    if ($item && !empty($item['id'])) {
                        $prods[] = $item;
                    }
                }
                if (!empty($prods)) return $prods;
            }
        } catch (Exception $e) {
            error_log("dbGetProducts error: " . $e->getMessage());
        }
    }
    return getMasterProductsList($rootDir, $productsFile);
}

// Helper: Get master products list with JSON fallback
function getMasterProductsList($rootDir, $productsFile) {
    $canonicalFile = $rootDir . '/assets/js/data/products_canonical.json';
    if (file_exists($canonicalFile)) {
        $data = readJsonFile($canonicalFile, null);
        if (is_array($data) && count($data) > 0) {
            return $data;
        }
    }

    if (file_exists($productsFile)) {
        $content = file_get_contents($productsFile);
        if (preg_match('/window\.DEFAULT_STORE_PRODUCTS\s*=\s*(\[[\s\S]*?\]);\s*\n/u', $content, $m)) {
            $data = json_decode($m[1], true);
            if (is_array($data) && count($data) > 0) {
                return $data;
            }
        }
        if (preg_match('/window\.DEFAULT_STORE_PRODUCTS\s*=\s*(\[[\s\S]*?\]);/s', $content, $m)) {
            $data = json_decode($m[1], true);
            if (is_array($data) && count($data) > 0) {
                return $data;
            }
        }
    }

    return [];
}

// Determine route
$requestUri = $_SERVER['REQUEST_URI'];
$uriParts = explode('?', $requestUri);
$path = $uriParts[0];

// Strip '/api/wholesale/' prefix
$route = '';
if (preg_match('#^/api/wholesale/(.*)$#', $path, $matches)) {
    $route = trim($matches[1], '/');
} elseif (isset($_GET['route'])) {
    $route = trim($_GET['route'], '/');
}

// Read raw body
$rawInput = file_get_contents('php://input');
$body = !empty($rawInput) ? json_decode($rawInput, true) : [];

// Extract Token
$token = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = trim($matches[1]);
} elseif (isset($_SERVER['HTTP_X_WHOLESALE_TOKEN'])) {
    $token = trim($_SERVER['HTTP_X_WHOLESALE_TOKEN']);
} elseif (isset($_COOKIE['wholesale_token'])) {
    $token = trim($_COOKIE['wholesale_token']);
}

// Auth Helper Fallback
function getAuthUser($token, $usersFile, $sessionsFile) {
    if (!$token) return null;
    $sessions = readJsonFile($sessionsFile, []);
    if (!isset($sessions[$token])) return null;

    $session = $sessions[$token];
    if (time() * 1000 > $session['expires_at']) {
        unset($sessions[$token]);
        writeJsonFile($sessionsFile, $sessions);
        return null;
    }

    $users = readJsonFile($usersFile, []);
    foreach ($users as $u) {
        if ($u['id'] == $session['user_id']) {
            return $u;
        }
    }
    return null;
}

function sanitizeUser($user) {
    if (!$user) return null;
    unset($user['password_hash'], $user['salt']);
    return $user;
}

$currentUser = dbGetAuthUser($pdo, $token, $usersFile, $sessionsFile);

function checkAdmin($reqUser, $adminSecretKey) {
    if ($reqUser && $reqUser['role'] === 'admin') return true;
    $adminKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
    return ($adminKey === $adminSecretKey);
}

// Cost & Margin Pricing Formula
function calcWholesalePrice($cost, $targetMargin, $marginFloor = 0.20) {
    if (!$cost || $cost <= 0) return null;
    if ($targetMargin >= 1.0) $targetMargin = 0.90;
    $price = round($cost / (1 - $targetMargin));
    if ($price <= 0) return (int)$cost;
    $margin = ($price - $cost) / $price;
    if ($margin < $marginFloor && (1 - $marginFloor) > 0) {
        $price = ceil($cost / (1 - $marginFloor));
    }
    return (int)$price;
}

// ----------------------------------------------------------------------------
// ROUTES DISPATCH
// ----------------------------------------------------------------------------

// 1. POST /api/wholesale/register
if ($route === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($body['fullName'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $phone = trim($body['phone'] ?? '');
    $password = $body['password'] ?? '';

    if (empty($fullName) || empty($email) || empty($phone) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Nom complet, email, téléphone et mot de passe sont obligatoires.']);
        exit;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Le mot de passe doit comporter au moins 8 caractères.']);
        exit;
    }

    $existing = dbGetUserByEmail($pdo, $email, $usersFile);
    if ($existing) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Un compte existe déjà avec cette adresse email.']);
        exit;
    }

    $salt = bin2hex(random_bytes(16));
    $password_hash = hash_pbkdf2('sha512', $password, $salt, 10000, 128);

    $newUser = [
        'id' => (int)(microtime(true) * 1000),
        'email' => $email,
        'password_hash' => $password_hash,
        'salt' => $salt,
        'full_name' => $fullName,
        'phone' => $phone,
        'role' => 'wholesale_applicant',
        'application_status' => 'pending',
        'business_name' => trim($body['businessName'] ?? ''),
        'country' => trim($body['country'] ?? 'Maroc'),
        'city' => trim($body['city'] ?? ''),
        'business_type' => $body['businessType'] ?? 'other',
        'sales_channel' => trim($body['salesChannel'] ?? ''),
        'website_social_url' => trim($body['websiteSocialUrl'] ?? ''),
        'estimated_initial_order' => $body['estimatedInitialOrder'] ?? '10-25',
        'expected_reorder_freq' => $body['expectedReorderFreq'] ?? 'monthly',
        'selling_status' => $body['sellingStatus'] ?? 'already_selling',
        'additional_info' => trim($body['additionalInfo'] ?? ''),
        'admin_notes' => '',
        'info_request_message' => null,
        'applicant_response' => null,
        'created_at' => gmdate('Y-m-d H:i:s'),
        'updated_at' => gmdate('Y-m-d H:i:s'),
        'approved_at' => null
    ];

    dbSaveUser($pdo, $newUser, $usersFile);

    $newToken = bin2hex(random_bytes(32));
    $expiresAtMs = (time() + 7 * 86400) * 1000;
    dbSaveSession($pdo, $newToken, $newUser['id'], $expiresAtMs, $sessionsFile);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Votre candidature a été soumise avec succès.',
        'token' => $newToken,
        'user' => sanitizeUser($newUser)
    ]);
    exit;
}

// 2. POST /api/wholesale/login
if ($route === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email et mot de passe requis.']);
        exit;
    }

    $matched = dbGetUserByEmail($pdo, $email, $usersFile);
    if (!$matched) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Identifiants incorrects.']);
        exit;
    }

    $hash = hash_pbkdf2('sha512', $password, $matched['salt'], 10000, 128);
    if (!hash_equals($matched['password_hash'], $hash)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Identifiants incorrects.']);
        exit;
    }

    $newToken = bin2hex(random_bytes(32));
    $expiresAtMs = (time() + 7 * 86400) * 1000;
    dbSaveSession($pdo, $newToken, $matched['id'], $expiresAtMs, $sessionsFile);

    echo json_encode([
        'success' => true,
        'token' => $newToken,
        'user' => sanitizeUser($matched)
    ]);
    exit;
}

// 3. GET /api/wholesale/session
if ($route === 'session' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'authenticated' => false, 'error' => 'Session non authentifiée.']);
        exit;
    }
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user' => sanitizeUser($currentUser)
    ]);
    exit;
}

// 4. POST /api/wholesale/logout
if ($route === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($token) {
        dbDeleteSession($pdo, $token, $sessionsFile);
    }
    echo json_encode(['success' => true, 'message' => 'Déconnexion effectuée.']);
    exit;
}

// 5. POST /api/wholesale/submit-more-info
if ($route === 'submit-more-info' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authentification requise.']);
        exit;
    }

    $responseText = trim($body['responseText'] ?? '');
    if (empty($responseText)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Message d’information requis.']);
        exit;
    }

    $target = dbGetUserById($pdo, $currentUser['id'], $usersFile);
    if ($target) {
        $target['applicant_response'] = $responseText;
        $target['application_status'] = 'pending';
        $target['updated_at'] = gmdate('Y-m-d H:i:s');
        dbSaveUser($pdo, $target, $usersFile);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Informations transmises.',
        'user' => sanitizeUser($target ?? $currentUser)
    ]);
    exit;
}

// 6. GET /api/wholesale/catalog (STRICT AUTHORIZATION)
if ($route === 'catalog' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Accès restreint. Veuillez vous connecter à votre compte grossiste approuvé.',
            'code' => 'UNAUTHENTICATED'
        ]);
        exit;
    }

    if ($currentUser['application_status'] !== 'approved') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Accès non autorisé. Votre statut actuel est: ' . $currentUser['application_status'],
            'status' => $currentUser['application_status'],
            'code' => 'NOT_APPROVED'
        ]);
        exit;
    }

    $config = dbGetConfig($pdo, $configFile);
    $costs = $config['product_costs'] ?? [];
    $productMoqs = $config['product_moqs'] ?? [];
    $disabled = $config['disabled_products'] ?? [];

    $products = dbGetProducts($pdo, $rootDir, $productsFile);
    if (!is_array($products)) {
        $products = [];
    }

    $wholesaleProducts = [];
    foreach ($products as $p) {
        if (!is_array($p) || empty($p['id'])) continue;
        if (in_array($p['id'], $disabled) || !empty($p['isBundle']) || $p['id'] === 'pack-trio-tshirts') continue;
        
        $retail = (int)($p['price'] ?? 0);
        $cost = (int)($costs[$p['id']] ?? 0);
        if ($cost <= 0) {
            $cost = max(1, (int)round($retail * 0.35)); // Robust fallback
        }

        $sizesCount = (!empty($p['sizes']) && is_array($p['sizes'])) ? count($p['sizes']) : 4;
        $colorsCount = (!empty($p['colors']) && is_array($p['colors'])) ? count($p['colors']) : 1;
        $gridMoq = max(1, $sizesCount * $colorsCount);

        $manualMoq = $productMoqs[$p['id']] ?? null;
        $isManual = ($manualMoq !== null && (int)$manualMoq > 0);
        $pMoq = $isManual ? (int)$manualMoq : $gridMoq;

        $tierMinPrice = calcWholesalePrice($cost, 0.35, $config['margin_floor'] ?? 0.20);
        $tierMidPrice = calcWholesalePrice($cost, 0.30, $config['margin_floor'] ?? 0.20);
        $tierHighPrice = calcWholesalePrice($cost, 0.25, $config['margin_floor'] ?? 0.20);

        $savings = ($retail > 0 && $tierHighPrice !== null) ? (int)round((($retail - $tierHighPrice) / $retail) * 100) : 0;

        $wholesaleProducts[] = [
            'id' => $p['id'],
            'name' => $p['name'] ?? '',
            'slug' => $p['slug'] ?? $p['id'],
            'category' => $p['category'] ?? 't-shirts',
            'retailPrice' => $retail,
            'moq' => $pMoq,
            'gridMoq' => $gridMoq,
            'sizesCount' => $sizesCount,
            'colorsCount' => $colorsCount,
            'isManualMoq' => $isManual,
            'tierPrices' => [
                'tier_min' => $tierMinPrice,
                'tier_mid' => $tierMidPrice,
                'tier_high' => $tierHighPrice
            ],
            'savingsPercentage' => $savings,
            'shortDescription' => $p['shortDescription'] ?? '',
            'materials' => $p['materials'] ?? '',
            'fit' => $p['fit'] ?? '',
            'colors' => $p['colors'] ?? [],
            'sizes' => $p['sizes'] ?? ['S', 'M', 'L', 'XL'],
            'variants' => $p['variants'] ?? [],
            'images' => $p['images'] ?? []
        ];
    }

    echo json_encode([
        'success' => true,
        'moqPolicy' => 'per_product',
        'tiers' => $config['tiers'] ?? [],
        'productsCount' => count($wholesaleProducts),
        'products' => $wholesaleProducts
    ]);
    exit;
}

// 7. POST /api/wholesale/calculate-price
if ($route === 'calculate-price' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$currentUser || $currentUser['application_status'] !== 'approved') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès réservé aux grossistes approuvés.']);
        exit;
    }

    $config = dbGetConfig($pdo, $configFile);
    $costs = $config['product_costs'] ?? [];
    $productMoqs = $config['product_moqs'] ?? [];
    $items = $body['items'] ?? [];
    $products = dbGetProducts($pdo, $rootDir, $productsFile);

    $totalQty = 0;
    $productTotals = [];
    foreach ($items as $it) {
        $q = (int)($it['quantity'] ?? 0);
        if ($q > 0) {
            $totalQty += $q;
            $pid = $it['productId'];
            $productTotals[$pid] = ($productTotals[$pid] ?? 0) + $q;
        }
    }

    // Active tier
    $activeTier = $config['tiers'][0];
    foreach (array_reverse($config['tiers']) as $t) {
        if ($totalQty >= $t['min_qty'] && ($t['max_qty'] === null || $totalQty <= $t['max_qty'])) {
            $activeTier = $t;
            break;
        }
    }

    $targetMargin = $activeTier['target_margin'];
    $subtotal = 0;
    $calculated = [];

    foreach ($items as $it) {
        $qty = (int)($it['quantity'] ?? 0);
        if ($qty <= 0) continue;
        $cost = $costs[$it['productId']] ?? round(($it['retailPrice'] ?? 250) * 0.35);

        $unitPrice = calcWholesalePrice($cost, $targetMargin, $config['margin_floor'] ?? 0.20);
        $lineTotal = $unitPrice * $qty;
        $subtotal += $lineTotal;

        $calculated[] = [
            'productId' => $it['productId'],
            'variantId' => $it['variantId'] ?? '',
            'colorCode' => $it['colorCode'] ?? '',
            'colorName' => $it['colorName'] ?? '',
            'size' => $it['size'] ?? '',
            'quantity' => $qty,
            'unitPrice' => $unitPrice,
            'lineTotal' => $lineTotal
        ];
    }

    $productMoqStatus = [];
    $allMoqSatisfied = ($totalQty > 0);
    foreach ($productTotals as $pid => $q) {
        $pMatch = null;
        foreach ($products as $pr) { if ($pr['id'] === $pid) { $pMatch = $pr; break; } }
        $colors = !empty($pMatch['colors']) ? $pMatch['colors'] : [['code' => 'default']];
        $sizes = !empty($pMatch['sizes']) ? $pMatch['sizes'] : ['S', 'M', 'L', 'XL'];
        $starterPackUnits = max(1, count($sizes) * count($colors));

        $pMoq = $productMoqs[$pid] ?? null;
        if ($pMoq === null || (int)$pMoq <= 0) {
            $pMoq = $starterPackUnits;
        } else {
            $pMoq = (int)$pMoq;
        }

        $missingCombos = 0;
        foreach ($colors as $c) {
            $cCode = is_array($c) ? ($c['code'] ?? '') : (string)$c;
            foreach ($sizes as $s) {
                $found = false;
                foreach ($items as $it) {
                    if ($it['productId'] === $pid && ($it['colorCode'] ?? '') === $cCode && ($it['size'] ?? '') === $s && (int)($it['quantity'] ?? 0) >= 1) {
                        $found = true;
                        break;
                    }
                }
                if (!$found) $missingCombos++;
            }
        }

        $isStarterPackComplete = ($q > 0 && $missingCombos === 0);
        $met = ($q >= $pMoq && $isStarterPackComplete);
        if (!$met) $allMoqSatisfied = false;
        $productMoqStatus[$pid] = [
            'ordered' => $q,
            'moq' => $pMoq,
            'starterPackUnits' => $starterPackUnits,
            'missingCombos' => $missingCombos,
            'isStarterPackComplete' => $isStarterPackComplete,
            'met' => $met,
            'missing' => max(0, $pMoq - $q)
        ];
    }

    echo json_encode([
        'success' => true,
        'totalQuantity' => $totalQty,
        'moqPolicy' => 'per_product',
        'allMoqSatisfied' => $allMoqSatisfied,
        'productMoqStatus' => $productMoqStatus,
        'activeTier' => $activeTier,
        'subtotal' => $subtotal,
        'total' => $subtotal,
        'items' => $calculated
    ]);
    exit;
}

// 8. POST /api/wholesale/order (STRICT AUTHORIZATION & MARGIN FLOOR)
if ($route === 'order' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$currentUser || $currentUser['application_status'] !== 'approved') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Seuls les grossistes approuvés peuvent commander.']);
        exit;
    }

    $items = $body['items'] ?? [];
    $shippingAddress = $body['shippingAddress'] ?? [];
    $paymentMethod = $body['paymentMethod'] ?? 'Virement Bancaire (B2B)';
    $orderNote = $body['orderNote'] ?? '';

    $config = dbGetConfig($pdo, $configFile);
    $costs = $config['product_costs'] ?? [];
    $productMoqs = $config['product_moqs'] ?? [];

    $totalUnits = 0;
    $productQuantities = [];
    $productNames = [];
    foreach ($items as $it) {
        $qty = (int)($it['quantity'] ?? 0);
        if ($qty > 0) {
            $totalUnits += $qty;
            $pid = $it['productId'];
            $productQuantities[$pid] = ($productQuantities[$pid] ?? 0) + $qty;
            $productNames[$pid] = $it['name'] ?? $pid;
        }
    }

    if ($totalUnits <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Le panier de commande grossiste est vide.']);
        exit;
    }

    // Load products list for sizes x colors grid baseline
    $productsList = dbGetProducts($pdo, $rootDir, $productsFile);
    if (!is_array($productsList)) $productsList = [];

    // ENFORCE PER-PRODUCT MOQ & STARTER PACK (All Colors x Sizes Must Be Covered)
    foreach ($productQuantities as $pid => $qty) {
        $pMatch = null;
        foreach ($productsList as $pr) { if ($pr['id'] === $pid) { $pMatch = $pr; break; } }
        $colors = !empty($pMatch['colors']) ? $pMatch['colors'] : [['code' => 'default']];
        $sizes = !empty($pMatch['sizes']) ? $pMatch['sizes'] : ['S', 'M', 'L', 'XL'];
        $starterPackUnits = max(1, count($sizes) * count($colors));

        $pMoq = $productMoqs[$pid] ?? null;
        if ($pMoq === null || (int)$pMoq <= 0) {
            $pMoq = $starterPackUnits;
        } else {
            $pMoq = (int)$pMoq;
        }

        $missingCombos = 0;
        foreach ($colors as $c) {
            $cCode = is_array($c) ? ($c['code'] ?? '') : (string)$c;
            foreach ($sizes as $s) {
                $found = false;
                foreach ($items as $it) {
                    if ($it['productId'] === $pid && ($it['colorCode'] ?? '') === $cCode && ($it['size'] ?? '') === $s && (int)($it['quantity'] ?? 0) >= 1) {
                        $found = true;
                        break;
                    }
                }
                if (!$found) $missingCombos++;
            }
        }

        if ($qty < $pMoq || $missingCombos > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => "Pack Starter non complet pour \"{$productNames[$pid]}\". Ce modèle impose le Pack Starter complet (au moins 1 pièce pour chaque taille dans l'ensemble des " . count($colors) . " coloris = {$pMoq} pièces minimum)."
            ]);
            exit;
        }
    }

    $activeTier = $config['tiers'][0];
    foreach (array_reverse($config['tiers']) as $t) {
        if ($totalUnits >= $t['min_qty'] && ($t['max_qty'] === null || $totalUnits <= $t['max_qty'])) {
            $activeTier = $t;
            break;
        }
    }

    $targetMargin = $activeTier['target_margin'];
    $subtotal = 0;
    $validated = [];

    foreach ($items as $it) {
        $qty = (int)($it['quantity'] ?? 0);
        if ($qty <= 0) continue;
        $cost = $costs[$it['productId']] ?? round(($it['retailPrice'] ?? 250) * 0.35);

        $unitPrice = calcWholesalePrice($cost, $targetMargin, $config['margin_floor'] ?? 0.20);
        $lineTotal = $unitPrice * $qty;
        $subtotal += $lineTotal;

        $validated[] = [
            'productId' => $it['productId'],
            'variantId' => $it['variantId'] ?? '',
            'name' => $it['name'] ?? $it['productId'],
            'colorCode' => $it['colorCode'] ?? '',
            'colorName' => $it['colorName'] ?? '',
            'size' => $it['size'] ?? '',
            'quantity' => $qty,
            'unitPrice' => $unitPrice,
            'lineTotal' => $lineTotal
        ];
    }

    $orderNumber = 'WS-MA-' . mt_rand(100000, 999999);
    $order = [
        'id' => (int)(microtime(true) * 1000),
        'order_number' => $orderNumber,
        'user_id' => $currentUser['id'],
        'business_name' => $currentUser['business_name'] ?? '',
        'contact_name' => $currentUser['full_name'] ?? '',
        'contact_email' => $currentUser['email'] ?? '',
        'contact_phone' => $currentUser['phone'] ?? '',
        'shipping_address' => $shippingAddress,
        'tier_applied' => $activeTier['name'],
        'total_units' => $totalUnits,
        'subtotal' => $subtotal,
        'discount' => 0,
        'shipping_cost' => 0,
        'total' => $subtotal,
        'payment_method' => $paymentMethod,
        'order_note' => $orderNote,
        'status' => 'pending',
        'items' => $validated,
        'created_at' => gmdate('Y-m-d H:i:s')
    ];

    dbSaveOrder($pdo, $order, $ordersFile);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Commande grossiste confirmée.',
        'orderNumber' => $orderNumber,
        'total' => $subtotal,
        'totalUnits' => $totalUnits,
        'tierApplied' => $activeTier['name']
    ]);
    exit;
}

// 8b. GET /api/wholesale/orders (USER OR ADMIN ORDERS LIST)
if ($route === 'orders' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authentification requise.']);
        exit;
    }

    $isAdmin = ($currentUser['role'] === 'admin');
    $orders = [];
    if ($pdo) {
        try {
            if ($isAdmin) {
                $stmt = $pdo->query("SELECT * FROM `wholesale_orders` ORDER BY `created_at` DESC LIMIT 100");
            } else {
                $stmt = $pdo->prepare("SELECT * FROM `wholesale_orders` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 100");
                $stmt->execute([$currentUser['id']]);
            }
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $r['items'] = json_decode($r['items_json'] ?? '[]', true) ?: [];
                unset($r['items_json']);
                $orders[] = $r;
            }
        } catch (Exception $e) {}
    }
    if (empty($orders)) {
        $allOrders = readJsonFile($ordersFile, []);
        if ($isAdmin) {
            $orders = $allOrders;
        } else {
            $orders = array_values(array_filter($allOrders, fn($o) => ($o['user_id'] ?? null) == $currentUser['id']));
        }
    }

    echo json_encode(['success' => true, 'count' => count($orders), 'orders' => $orders]);
    exit;
}

// 9. GET /api/wholesale/admin/applications (ADMIN ONLY)
if ($route === 'admin/applications' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!checkAdmin($currentUser, $adminSecretKey)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès réservé aux administrateurs.']);
        exit;
    }

    $users = dbGetUsers($pdo, $usersFile);
    $statusFilter = $_GET['status'] ?? 'all';

    $filtered = array_filter($users, fn($u) => ($u['role'] ?? '') !== 'admin');
    if ($statusFilter !== 'all') {
        $filtered = array_filter($filtered, fn($u) => ($u['application_status'] ?? '') === $statusFilter);
    }

    $sanitized = array_map('sanitizeUser', array_values($filtered));

    $counts = [
        'all' => count(array_filter($users, fn($u) => ($u['role'] ?? '') !== 'admin')),
        'pending' => count(array_filter($users, fn($u) => ($u['application_status'] ?? '') === 'pending' && ($u['role'] ?? '') !== 'admin')),
        'more_info_required' => count(array_filter($users, fn($u) => ($u['application_status'] ?? '') === 'more_info_required')),
        'approved' => count(array_filter($users, fn($u) => ($u['application_status'] ?? '') === 'approved' && ($u['role'] ?? '') !== 'admin')),
        'rejected' => count(array_filter($users, fn($u) => ($u['application_status'] ?? '') === 'rejected')),
        'suspended' => count(array_filter($users, fn($u) => ($u['application_status'] ?? '') === 'suspended'))
    ];

    echo json_encode([
        'success' => true,
        'counts' => $counts,
        'applications' => $sanitized
    ]);
    exit;
}

// 10. POST /api/wholesale/admin/update-status (ADMIN ONLY)
if ($route === 'admin/update-status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!checkAdmin($currentUser, $adminSecretKey)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Action non autorisée.']);
        exit;
    }

    $userId = $body['userId'] ?? 0;
    $status = $body['status'] ?? '';
    $notes = $body['adminNotes'] ?? null;
    $infoMsg = $body['infoRequestMessage'] ?? null;

    $target = dbGetUserById($pdo, $userId, $usersFile);
    if ($target) {
        $target['application_status'] = $status;
        $target['updated_at'] = gmdate('Y-m-d H:i:s');
        if ($notes !== null) $target['admin_notes'] = $notes;
        if ($status === 'more_info_required') {
            $target['info_request_message'] = $infoMsg ?: 'Veuillez nous transmettre des informations complémentaires.';
        } elseif ($status === 'approved') {
            $target['role'] = 'wholesale_customer';
            $target['approved_at'] = gmdate('Y-m-d H:i:s');
            $target['info_request_message'] = null;
        }
        dbSaveUser($pdo, $target, $usersFile);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Statut mis à jour.',
        'user' => sanitizeUser($target)
    ]);
    exit;
}

// 11. GET & POST /api/wholesale/admin/settings
if ($route === 'admin/settings') {
    if (!checkAdmin($currentUser, $adminSecretKey)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès réservé aux administrateurs.']);
        exit;
    }

    $config = dbGetConfig($pdo, $configFile);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $products = dbGetProducts($pdo, $rootDir, $productsFile);
        if (!is_array($products)) $products = [];

        $costs = $config['product_costs'] ?? [];
        $productMoqs = $config['product_moqs'] ?? [];
        $disabled = $config['disabled_products'] ?? [];

        $enriched = [];
        foreach ($products as $p) {
            if (!empty($p['isBundle']) || ($p['id'] ?? '') === 'pack-trio-tshirts') continue;
            $sizesCount = !empty($p['sizes']) ? count($p['sizes']) : 4;
            $colorsCount = !empty($p['colors']) ? count($p['colors']) : 1;
            $gridMoq = max(1, $sizesCount * $colorsCount);
            $manualMoq = $productMoqs[$p['id']] ?? null;
            $isManual = ($manualMoq !== null && (int)$manualMoq > 0);
            $effectiveMoq = $isManual ? (int)$manualMoq : $gridMoq;

            $enriched[] = [
                'id' => $p['id'],
                'name' => $p['name'],
                'retailPrice' => $p['price'] ?? 0,
                'unitCost' => $costs[$p['id']] ?? 0,
                'moq' => $effectiveMoq,
                'gridMoq' => $gridMoq,
                'sizesCount' => $sizesCount,
                'colorsCount' => $colorsCount,
                'isManualMoq' => $isManual,
                'disabled' => in_array($p['id'], $disabled)
            ];
        }

        echo json_encode([
            'success' => true,
            'config' => $config,
            'products' => $enriched
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($body['moq'])) $config['moq'] = (int)$body['moq'];
        if (isset($body['tiers'])) $config['tiers'] = $body['tiers'];
        if (isset($body['productCosts'])) $config['product_costs'] = $body['productCosts'];
        if (isset($body['productMoqs'])) $config['product_moqs'] = $body['productMoqs'];
        if (isset($body['product_moqs'])) $config['product_moqs'] = $body['product_moqs'];
        if (isset($body['disabledProducts'])) $config['disabled_products'] = $body['disabledProducts'];
        
        dbSaveConfig($pdo, $config, $configFile);

        echo json_encode(['success' => true, 'message' => 'Configuration enregistrée.', 'config' => $config]);
        exit;
    }
}

// 12. GET /api/wholesale/migrate-db OR admin/sync-db
if ($route === 'migrate-db' || $route === 'admin/sync-db') {
    if (!checkAdmin($currentUser, $adminSecretKey)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès réservé aux administrateurs.']);
        exit;
    }
    require_once __DIR__ . '/migrate-db.php';
    exit;
}

http_response_code(404);
echo json_encode(['success' => false, 'error' => 'Endpoint wholesale non trouvé: ' . $route]);
