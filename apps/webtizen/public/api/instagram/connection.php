<?php
declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ik_json(405, array('ok' => false, 'message' => 'GET 요청만 허용됩니다.'));
}

ik_require_admin();
$config = ik_require_config();
$pdo = ik_require_db($config);
$connection = ik_find_connection($pdo);

if ($connection === null) {
    ik_json(200, array('ok' => true, 'connected' => false));
}

ik_json(200, array(
    'ok' => true,
    'connected' => true,
    'connection' => array(
        'id' => (int) $connection['id'],
        'instagramUserId' => (string) $connection['instagram_user_id'],
        'username' => (string) $connection['username'],
        'accountType' => (string) $connection['account_type'],
        'tokenExpiresAt' => $connection['token_expires_at'],
        'webhookLastReceivedAt' => $connection['last_webhook_at'],
    ),
));
