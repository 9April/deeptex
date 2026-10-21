<?php
/**
 * ATELIER E-Commerce - Contact Form API
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

if (!$payload || empty($payload['email']) || empty($payload['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email et message obligatoires']);
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO `contact_messages` (`name`, `email`, `phone`, `subject`, `message`)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([
    $payload['name'] ?? '',
    $payload['email'],
    $payload['phone'] ?? '',
    $payload['subject'] ?? 'Message Client',
    $payload['message']
]);

echo json_encode(['success' => true, 'message' => 'Message envoyé avec succès']);
