<?php
/**
 * ATELIER E-Commerce - Image Upload API Endpoint
 * Compatible with Apache / PHP on Hostinger and standard servers.
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
if (!$payload || empty($payload['productId']) || empty($payload['dataUrl'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'productId and dataUrl are required']);
    exit;
}

$productId = preg_replace('/[^a-z0-9_-]/', '-', strtolower($payload['productId']));
$category  = !empty($payload['category']) ? preg_replace('/[^a-z0-9_-]/', '-', strtolower($payload['category'])) : 't-shirts';
$filename  = !empty($payload['filename']) ? preg_replace('/[^a-z0-9._-]/', '-', strtolower($payload['filename'])) : ('image-' . time() . '.png');

if (!pathinfo($filename, PATHINFO_EXTENSION)) {
    $filename .= '.png';
}

$rootDir = dirname(__DIR__);
$targetDir = $rootDir . '/assets/images/products/' . $category . '/' . $productId;

if (!is_dir($targetDir)) {
    if (!mkdir($targetDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create upload directory']);
        exit;
    }
}

$dataUrl = $payload['dataUrl'];
if (preg_match('/^data:([A-Za-z0-9\/+-]+);base64,(.+)$/', $dataUrl, $matches)) {
    $data = base64_decode($matches[2]);
} else {
    $data = base64_decode($dataUrl);
}

if ($data === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid base64 data']);
    exit;
}

$finalPath = $targetDir . '/' . $filename;
if (file_put_contents($finalPath, $data) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write file to disk']);
    exit;
}

$relativePath = 'assets/images/products/' . $category . '/' . $productId . '/' . $filename;

echo json_encode([
    'success' => true,
    'path' => $relativePath,
    'filename' => $filename,
    'size' => strlen($data)
]);
