<?php
/**
 * ATELIER E-Commerce - WhatsApp Business Cloud API Helper
 * Dispatches automated order confirmation and utility notifications.
 */

function getWhatsAppConfig() {
    $configFile = __DIR__ . '/../assets/js/data/whatsapp_config.json';
    if (file_exists($configFile)) {
        $content = file_get_contents($configFile);
        $data = json_decode($content, true);
        if (is_array($data)) return $data;
    }
    return [
        'enabled' => false,
        'phone_number_id' => getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '',
        'access_token' => getenv('WHATSAPP_ACCESS_TOKEN') ?: '',
        'template_name' => 'hello_world',
        'language_code' => 'en_US'
    ];
}

/**
 * Format any phone number to international WhatsApp standard (E.164 without plus)
 * Handles Moroccan numbers: 0612345678 -> 212612345678, +212612345678 -> 212612345678
 */
function formatWhatsAppPhoneNumber($phone) {
    $clean = preg_replace('/[^0-9]/', '', (string)$phone);
    if (empty($clean)) return '';

    // Handle 06xxxxxxxx / 07xxxxxxxx (Morocco)
    if (strpos($clean, '0') === 0 && (strlen($clean) === 10)) {
        return '212' . substr($clean, 1);
    }
    // Handle 6xxxxxxxx / 7xxxxxxxx (Morocco 9 digits missing country code)
    if ((strpos($clean, '6') === 0 || strpos($clean, '7') === 0) && strlen($clean) === 9) {
        return '212' . $clean;
    }
    return $clean;
}

/**
 * Send WhatsApp Message using Meta Cloud API
 */
function sendWhatsAppMessage($toPhone, $templateName = 'hello_world', $languageCode = 'en_US', $bodyParams = []) {
    $config = getWhatsAppConfig();
    $phoneNumberId = trim($config['phone_number_id'] ?? '');
    $accessToken = trim($config['access_token'] ?? '');

    if (empty($phoneNumberId) || empty($accessToken)) {
        return [
            'success' => false,
            'error' => 'WhatsApp Cloud API non configuré (Phone Number ID ou Access Token manquant).'
        ];
    }

    $formattedRecipient = formatWhatsAppPhoneNumber($toPhone);
    if (empty($formattedRecipient)) {
        return [
            'success' => false,
            'error' => 'Numéro de téléphone destinataire invalide.'
        ];
    }

    $url = "https://graph.facebook.com/v20.0/{$phoneNumberId}/messages";

    $templatePayload = [
        "name" => $templateName,
        "language" => [ "code" => $languageCode ]
    ];

    if (!empty($bodyParams)) {
        $parameters = [];
        foreach ($bodyParams as $p) {
            $parameters[] = [ "type" => "text", "text" => (string)$p ];
        }
        $templatePayload["components"] = [
            [
                "type" => "body",
                "parameters" => $parameters
            ]
        ];
    }

    $postData = [
        "messaging_product" => "whatsapp",
        "to" => $formattedRecipient,
        "type" => "template",
        "template" => $templatePayload
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . $accessToken,
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode($postData),
        CURLOPT_TIMEOUT => 8
    ]);

    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['success' => false, 'error' => "Curl error: " . $curlErr];
    }

    $resData = json_decode($raw, true);
    if ($httpCode >= 200 && $httpCode < 300) {
        return [
            'success' => true,
            'httpCode' => $httpCode,
            'data' => $resData
        ];
    }

    $metaMsg = $resData['error']['message'] ?? $raw;
    return [
        'success' => false,
        'httpCode' => $httpCode,
        'error' => $metaMsg,
        'details' => $resData
    ];
}

// ----------------------------------------------------------------------------
// DIRECT HTTP REQUEST ROUTER
// ----------------------------------------------------------------------------
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'whatsapp.php') {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Key');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $action = $_GET['action'] ?? '';
    if (strpos($uri, 'whatsapp/config') !== false || $action === 'config') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            echo json_encode(['success' => true, 'config' => getWhatsAppConfig()]);
            exit;
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $raw = file_get_contents('php://input');
            $payload = json_decode($raw, true) ?: [];
            $current = getWhatsAppConfig();
            $updated = [
                'enabled' => !empty($payload['enabled']),
                'phone_number_id' => trim($payload['phone_number_id'] ?? $current['phone_number_id'] ?? ''),
                'access_token' => trim($payload['access_token'] ?? $current['access_token'] ?? ''),
                'test_recipient' => trim($payload['test_recipient'] ?? $current['test_recipient'] ?? ''),
                'template_name' => trim($payload['template_name'] ?? $current['template_name'] ?? 'hello_world'),
                'language_code' => trim($payload['language_code'] ?? $current['language_code'] ?? 'en_US')
            ];
            $configFile = __DIR__ . '/../assets/js/data/whatsapp_config.json';
            file_put_contents($configFile, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(['success' => true, 'message' => 'Configuration sauvegardée', 'config' => $updated]);
            exit;
        }
    }

    if (strpos($uri, 'whatsapp/test') !== false || $action === 'test') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true) ?: [];
        $cfg = getWhatsAppConfig();
        $target = $payload['recipient'] ?? ($cfg['test_recipient'] ?? '');
        $tpl = $payload['template_name'] ?? ($cfg['template_name'] ?? 'hello_world');
        $lang = $payload['language_code'] ?? ($cfg['language_code'] ?? 'en_US');
        $params = $payload['params'] ?? [];
        $res = sendWhatsAppMessage($target, $tpl, $lang, $params);
        http_response_code($res['success'] ? 200 : 400);
        echo json_encode($res);
        exit;
    }
}

