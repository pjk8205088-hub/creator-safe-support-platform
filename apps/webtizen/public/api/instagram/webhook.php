<?php
declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$config = ik_require_config();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $verifyToken = ik_config_value($config, 'meta_webhook_verify_token');
    } catch (Throwable $error) {
        ik_json(503, array('ok' => false, 'message' => '웹훅 서버 설정이 아직 완료되지 않았습니다.'));
    }
    $mode = (string) ($_GET['hub_mode'] ?? '');
    $challenge = (string) ($_GET['hub_challenge'] ?? '');
    $incomingToken = (string) ($_GET['hub_verify_token'] ?? '');
    if ($mode === 'subscribe' && $challenge !== '' && hash_equals($verifyToken, $incomingToken)) {
        header('Content-Type: text/plain; charset=utf-8');
        header('Cache-Control: no-store, private');
        echo $challenge;
        exit;
    }
    ik_json(403, array('ok' => false, 'message' => '웹훅 검증에 실패했습니다.'));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ik_json(405, array('ok' => false, 'message' => 'GET 또는 POST 요청만 허용됩니다.'));
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > 524288) {
    ik_json(400, array('ok' => false, 'message' => '웹훅 본문을 읽을 수 없습니다.'));
}
try {
    if (!ik_is_valid_webhook_signature($rawBody, $config)) {
        ik_json(403, array('ok' => false, 'message' => '웹훅 서명이 올바르지 않습니다.'));
    }
} catch (Throwable $error) {
    error_log('[Influencer Korea Webhook] ' . $error->getMessage());
    ik_json(503, array('ok' => false, 'message' => '웹훅 서명 설정이 아직 완료되지 않았습니다.'));
}

$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
    ik_json(400, array('ok' => false, 'message' => '웹훅 JSON 형식이 올바르지 않습니다.'));
}

$pdo = ik_require_db($config);
$payloadHash = hash('sha256', $rawBody);
$eventType = isset($payload['object']) ? substr((string) $payload['object'], 0, 80) : 'instagram';
$eventStatement = $pdo->prepare('INSERT IGNORE INTO instagram_webhook_events (payload_hash, event_type) VALUES (:payload_hash, :event_type)');
$eventStatement->execute(array(':payload_hash' => $payloadHash, ':event_type' => $eventType));

$entries = isset($payload['entry']) && is_array($payload['entry']) ? $payload['entry'] : array();
foreach ($entries as $entry) {
    if (!is_array($entry)) {
        continue;
    }
    $instagramUserId = (string) ($entry['id'] ?? '');
    if ($instagramUserId === '') {
        continue;
    }
    $connectionStatement = $pdo->prepare('SELECT * FROM instagram_connections WHERE instagram_user_id = :instagram_user_id AND is_active = 1 LIMIT 1');
    $connectionStatement->execute(array(':instagram_user_id' => $instagramUserId));
    $connection = $connectionStatement->fetch();
    if (!is_array($connection)) {
        continue;
    }
    $pdo->prepare('UPDATE instagram_connections SET last_webhook_at = UTC_TIMESTAMP() WHERE id = :id')->execute(array(':id' => $connection['id']));
    $events = isset($entry['messaging']) && is_array($entry['messaging']) ? $entry['messaging'] : array();
    foreach ($events as $event) {
        if (!is_array($event) || (empty($event['message']) && empty($event['postback']))) {
            continue;
        }
        $senderId = (string) ($event['sender']['id'] ?? '');
        if ($senderId === '' || hash_equals((string) $connection['instagram_user_id'], $senderId)) {
            continue;
        }
        $conversationStatement = $pdo->prepare('INSERT INTO instagram_conversations (connection_id, recipient_igsid, last_inbound_at, last_event_at) VALUES (:connection_id, :recipient_igsid, UTC_TIMESTAMP(), UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE last_inbound_at = UTC_TIMESTAMP(), last_event_at = UTC_TIMESTAMP()');
        $conversationStatement->execute(array(
            ':connection_id' => $connection['id'],
            ':recipient_igsid' => substr($senderId, 0, 120),
        ));
    }
}

ik_json(200, array('ok' => true));
