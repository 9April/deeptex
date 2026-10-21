<?php
/**
 * ATELIER E-Commerce - Newsletter Subscription API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

if (!$payload || empty($payload['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email obligatoire']);
    exit;
}

$email = filter_var(trim($payload['email']), FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Format email invalide']);
    exit;
}

$stmt = $pdo->prepare("INSERT IGNORE INTO `newsletter_subscribers` (`email`) VALUES (?)");
$stmt->execute([$email]);

echo json_encode(['success' => true, 'message' => 'Inscription réussie']);
