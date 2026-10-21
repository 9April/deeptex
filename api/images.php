<?php
/**
 * ATELIER E-Commerce - Image Library Scan API Endpoint
 * Scans assets/images recursively and returns available images for admin pickers.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rootDir = dirname(__DIR__);
$imagesDir = $rootDir . '/assets/images';
$results = [];

function scanImagesDir($dir, $baseDir, &$results) {
    if (!is_dir($dir)) return;
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || strpos($item, '.') === 0) continue;
        $fullPath = $dir . '/' . $item;
        if (is_dir($fullPath)) {
            scanImagesDir($fullPath, $baseDir, $results);
        } elseif (preg_match('/\.(png|jpe?g|webp|svg)$/i', $item)) {
            $rel = str_replace($baseDir . '/', '', $fullPath);
            $cleanLabel = pathinfo($item, PATHINFO_FILENAME);
            $cleanLabel = str_replace(['-', '_'], ' ', $cleanLabel);
            $cleanLabel = ucwords($cleanLabel);

            // Infer color from path or filename
            $color = 'default';
            $lower = strtolower($fullPath);
            if (strpos($lower, 'black') !== false || strpos($lower, 'noir') !== false) $color = 'black';
            elseif (strpos($lower, 'white') !== false || strpos($lower, 'blanc') !== false) $color = 'white';
            elseif (strpos($lower, 'blue') !== false || strpos($lower, 'bleu') !== false || strpos($lower, 'navy') !== false) $color = 'navy';
            elseif (strpos($lower, 'pink') !== false || strpos($lower, 'rose') !== false) $color = 'pink';
            elseif (strpos($lower, 'beig') !== false || strpos($lower, 'tan') !== false) $color = 'beig';
            elseif (strpos($lower, 'grey') !== false || strpos($lower, 'gris') !== false || strpos($lower, 'charcoal') !== false) $color = 'charcoal';
            elseif (strpos($lower, 'olive') !== false || strpos($lower, 'green') !== false || strpos($lower, 'vert') !== false) $color = 'green-army';

            $results[] = [
                'label' => $cleanLabel,
                'url' => 'assets/images/' . $rel,
                'color' => $color
            ];
        }
    }
}

scanImagesDir($imagesDir, $imagesDir, $results);

echo json_encode([
    'success' => true,
    'count' => count($results),
    'images' => $results
]);
