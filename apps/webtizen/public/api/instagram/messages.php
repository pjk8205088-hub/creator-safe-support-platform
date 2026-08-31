<?php
declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ik_json(405, array('ok' => false, 'message' => 'POST 요청만 허용됩니다.'));
}

ik_require_admin();
$config = ik_require_config();
$pdo = ik_require_db($config);
$body = ik_read_json_body();
$connectionId = (int) ($body['connectionId'] ?? 0);
$recipientId = trim((string) ($body['recipientId'] ?? ''));
$message = trim((string) ($body['message'] ?? ''));
$messageLength = function_exists('mb_strlen') ? mb_strlen($message, 'UTF-8') : strlen($message);

if ($connectionId < 1 || $recipientId === '' || strlen($recipientId) > 120 || $message === '' || $messageLength > 1000) {
    ik_json(422, array('ok' => false, 'message' => '수신자 ID 또는 메시지 내용을 확인해 주세요.'));
}

$connection = ik_find_connection($pdo, $connectionId);
if ($connection === null) {
    ik_json(404, array('ok' => false, 'message' => '연결된 Instagram Professional 계정을 찾을 수 없습니다.'));
}

$windowStatement = $pdo->prepare('SELECT id FROM instagram_conversations WHERE connection_id = :connection_id AND recipient_igsid = :recipient_igsid AND last_inbound_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR) LIMIT 1');
$windowStatement->execute(array(':connection_id' => $connectionId, ':recipient_igsid' => $recipientId));
if (!$windowStatement->fetch()) {
    ik_json(409, array('ok' => false, 'message' => '이 팬의 최근 수신 DM이 없거나 Meta의 답장 가능 시간이 지났습니다.'));
}

try {
    $accessToken = ik_decrypt((string) $connection['token_ciphertext'], $config);
    $graphUrl = isset($config['meta_graph_url']) && $config['meta_graph_url'] !== ''
        ? rtrim((string) $config['meta_graph_url'], '/')
        : 'https://graph.instagram.com';
    $metaResult = ik_http_request($graphUrl . '/' . rawurlencode((string) $connection['instagram_user_id']) . '/messages', 'POST', array(
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
        'Accept: application/json',
    ), json_encode(array(
        'recipient' => array('id' => $recipientId),
        'message' => array('text' => $message),
    ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

    if ($metaResult['status'] < 200 || $metaResult['status'] >= 300) {
        throw new RuntimeException('Meta message request failed.');
    }
    $messageId = (string) ($metaResult['payload']['message_id'] ?? $metaResult['payload']['id'] ?? '');
    $logStatement = $pdo->prepare('INSERT INTO instagram_message_logs (connection_id, recipient_igsid, direction, message_ciphertext, message_preview, meta_message_id, delivery_status, retained_until) VALUES (:connection_id, :recipient_igsid, :direction, :message_ciphertext, :message_preview, :meta_message_id, :delivery_status, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 90 DAY))');
    $logStatement->execute(array(
        ':connection_id' => $connectionId,
        ':recipient_igsid' => $recipientId,
        ':direction' => 'outbound',
        ':message_ciphertext' => ik_encrypt($message, $config),
        ':message_preview' => '운영자 Instagram DM 발송',
        ':meta_message_id' => substr($messageId, 0, 191),
        ':delivery_status' => 'requested',
    ));
    $messageLogId = (int) $pdo->lastInsertId();
    ik_audit($pdo, 'instagram.dm.sent', array('connection_id' => $connectionId, 'recipient_igsid' => $recipientId, 'message_log_id' => $messageLogId));
    ik_json(201, array('ok' => true, 'messageLogId' => $messageLogId));
} catch (Throwable $error) {
    error_log('[Influencer Korea Instagram send] ' . $error->getMessage());
    ik_audit($pdo, 'instagram.dm.failed', array('connection_id' => $connectionId, 'recipient_igsid' => $recipientId));
    ik_json(502, array('ok' => false, 'message' => 'Instagram DM 발송을 완료하지 못했습니다. 연결 상태와 Meta 권한을 확인해 주세요.'));
}
