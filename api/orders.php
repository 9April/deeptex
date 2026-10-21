<?php
/**
 * ATELIER E-Commerce - Orders API
 * Saves, fetches, and updates orders directly in MySQL.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';

try {
    $pdo = getDbConnection();
    initDbTables($pdo);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ----------------------------------------------------------------------------
// GET: Fetch orders list (used by Admin Dashboard)
// ----------------------------------------------------------------------------
if ($method === 'GET') {
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $orderNumber = isset($_GET['order']) ? trim($_GET['order']) : '';

    if ($orderNumber !== '') {
        $stmt = $pdo->prepare("SELECT * FROM `orders` WHERE `order_number` = ? LIMIT 1");
        $stmt->execute([$orderNumber]);
        $order = $stmt->fetch();
        if ($order) {
            $order['items'] = json_decode($order['items_json'], true) ?: [];
            unset($order['items_json']);
            echo json_encode(['success' => true, 'order' => $order]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Order not found']);
        }
        exit;
    }

    if ($status !== '' && $status !== 'all') {
        $stmt = $pdo->prepare("SELECT * FROM `orders` WHERE `status` = ? ORDER BY `created_at` DESC LIMIT 100");
        $stmt->execute([$status]);
    } else {
        $stmt = $pdo->query("SELECT * FROM `orders` ORDER BY `created_at` DESC LIMIT 100");
    }

    $rows = $stmt->fetchAll();
    $orders = [];
    foreach ($rows as $row) {
        $row['items'] = json_decode($row['items_json'], true) ?: [];
        unset($row['items_json']);
        $orders[] = $row;
    }

    echo json_encode([
        'success' => true,
        'count' => count($orders),
        'orders' => $orders
    ]);
    exit;
}

// ----------------------------------------------------------------------------
// POST: Create new order (checkout) OR update order status
// ----------------------------------------------------------------------------
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    // Action: Update Order Status
    if (isset($_GET['action']) && $_GET['action'] === 'update_status' || isset($payload['action']) && $payload['action'] === 'update_status') {
        $orderNum = !empty($payload['orderNumber']) ? trim($payload['orderNumber']) : '';
        $newStatus = !empty($payload['status']) ? trim($payload['status']) : '';

        if (!$orderNum || !$newStatus) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'orderNumber and status are required']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE `orders` SET `status` = ? WHERE `order_number` = ?");
        $stmt->execute([$newStatus, $orderNum]);

        echo json_encode(['success' => true, 'orderNumber' => $orderNum, 'status' => $newStatus]);
        exit;
    }

    // Action: Create New Order
    $orderNumber = !empty($payload['orderNumber']) ? trim($payload['orderNumber']) : ('MA-' . rand(100000, 999999));
    $customer = $payload['customer'] ?? [];
    $address = $payload['shippingAddress'] ?? [];
    $items = $payload['items'] ?? [];
    $subtotal = floatval($payload['subtotal'] ?? 0);
    $discount = floatval($payload['discount'] ?? 0);
    $shipping = floatval($payload['shipping'] ?? 0);
    $total = floatval($payload['total'] ?? ($subtotal - $discount + $shipping));
    $paymentMethod = $payload['paymentMethod'] ?? 'Paiement à la livraison (COD)';
    $note = $payload['orderNote'] ?? '';

    $stmt = $pdo->prepare("
        INSERT INTO `orders` (
            `order_number`, `customer_first_name`, `customer_last_name`, `customer_email`, `customer_phone`,
            `shipping_address`, `shipping_apartment`, `shipping_city`, `shipping_postal`, `shipping_country`,
            `payment_method`, `subtotal`, `discount`, `shipping_cost`, `total`, `order_note`, `status`, `items_json`
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, 'pending', ?
        )
    ");

    $stmt->execute([
        $orderNumber,
        $customer['firstName'] ?? '',
        $customer['lastName'] ?? '',
        $customer['email'] ?? '',
        $customer['phone'] ?? '',
        $address['address'] ?? '',
        $address['apartment'] ?? '',
        $address['city'] ?? '',
        $address['postal'] ?? '',
        $address['country'] ?? 'Maroc',
        $paymentMethod,
        $subtotal,
        $discount,
        $shipping,
        $total,
        $note,
        json_encode($items, JSON_UNESCAPED_UNICODE)
    ]);

    // Dispatch WhatsApp Notification if configured
    try {
        require_once __DIR__ . '/whatsapp.php';
        $wsCfg = getWhatsAppConfig();
        if (!empty($wsCfg['enabled']) && !empty($customer['phone'])) {
            $fullName = trim(($customer['firstName'] ?? '') . ' ' . ($customer['lastName'] ?? ''));
            $tpl = $wsCfg['template_name'] ?? 'hello_world';
            $lang = $wsCfg['language_code'] ?? 'en_US';
            $params = ($tpl === 'hello_world') ? [] : [$fullName ?: 'Client', $orderNumber, (string)$total];
            sendWhatsAppMessage($customer['phone'], $tpl, $lang, $params);
        }
    } catch (Exception $wEx) {
        error_log("WhatsApp dispatch error: " . $wEx->getMessage());
    }

    echo json_encode([
        'success' => true,
        'orderNumber' => $orderNumber,
        'id' => $pdo->lastInsertId(),
        'message' => 'Commande enregistrée avec succès dans la base de données'
    ]);
    exit;
}
