<?php
declare(strict_types=1);

function ik_json(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ik_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
}

function ik_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('ik_admin');
    session_set_cookie_params(array(
        'lifetime' => 0,
        'path' => '/',
        'secure' => ik_is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ));
    session_start();
}

function ik_require_admin(): void
{
    ik_start_session();
    if (empty($_SESSION['ik_admin_id'])) {
        ik_json(401, array('ok' => false, 'message' => '관리자 로그인 세션이 필요합니다.'));
    }
}

function ik_load_config(): array
{
    $path = getenv('IK_SECRETS_PATH');
    if (!$path) {
        // api/instagram is inside public_html; keep the secret file one level above it.
        $path = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'ik-secrets.php';
    }
    if (!is_file($path)) {
        throw new RuntimeException('서버 비밀 설정 파일을 찾을 수 없습니다.');
    }
    $config = require $path;
    if (!is_array($config)) {
        throw new RuntimeException('서버 비밀 설정 파일 형식이 올바르지 않습니다.');
    }
    return $config;
}

function ik_require_config(): array
{
    try {
        return ik_load_config();
    } catch (Throwable $error) {
        error_log('[Influencer Korea] ' . $error->getMessage());
        ik_json(503, array('ok' => false, 'message' => '서버 비밀 설정이 아직 완료되지 않았습니다.'));
    }
}

function ik_config_value(array $config, string $key): string
{
    $value = isset($config[$key]) ? trim((string) $config[$key]) : '';
    if ($value === '') {
        throw new RuntimeException('필수 서버 설정이 비어 있습니다: ' . $key);
    }
    return $value;
}

function ik_db(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db = isset($config['db']) && is_array($config['db']) ? $config['db'] : array();
    $dsn = isset($db['dsn']) ? (string) $db['dsn'] : '';
    $username = isset($db['username']) ? (string) $db['username'] : '';
    $password = isset($db['password']) ? (string) $db['password'] : '';
    if ($dsn === '' || $username === '' || $password === '') {
        throw new RuntimeException('데이터베이스 연결 설정이 비어 있습니다.');
    }

    $pdo = new PDO($dsn, $username, $password, array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ));
    return $pdo;
}

function ik_require_db(array $config): PDO
{
    try {
        return ik_db($config);
    } catch (Throwable $error) {
        error_log('[Influencer Korea DB] ' . $error->getMessage());
        ik_json(503, array('ok' => false, 'message' => 'DM 데이터베이스 연결을 확인해 주세요.'));
    }
}

function ik_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 131072) {
        ik_json(400, array('ok' => false, 'message' => '요청 본문을 읽을 수 없습니다.'));
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        ik_json(400, array('ok' => false, 'message' => 'JSON 요청 형식이 올바르지 않습니다.'));
    }
    return $data;
}

function ik_encrypt(string $plainText, array $config): string
{
    if (!function_exists('openssl_encrypt')) {
        throw new RuntimeException('OpenSSL이 필요합니다.');
    }
    $key = hash('sha256', ik_config_value($config, 'token_encryption_key'), true);
    $iv = random_bytes(12);
    $tag = '';
    $cipherText = openssl_encrypt($plainText, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($cipherText === false || strlen($tag) !== 16) {
        throw new RuntimeException('암호화에 실패했습니다.');
    }
    return base64_encode($iv . $tag . $cipherText);
}

function ik_decrypt(string $encoded, array $config): string
{
    if (!function_exists('openssl_decrypt')) {
        throw new RuntimeException('OpenSSL이 필요합니다.');
    }
    $payload = base64_decode($encoded, true);
    if ($payload === false || strlen($payload) < 29) {
        throw new RuntimeException('암호화된 토큰 형식이 올바르지 않습니다.');
    }
    $key = hash('sha256', ik_config_value($config, 'token_encryption_key'), true);
    $iv = substr($payload, 0, 12);
    $tag = substr($payload, 12, 16);
    $cipherText = substr($payload, 28);
    $plainText = openssl_decrypt($cipherText, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($plainText === false) {
        throw new RuntimeException('토큰 복호화에 실패했습니다.');
    }
    return $plainText;
}

function ik_http_request(string $url, string $method, array $headers = array(), ?string $body = null): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('cURL PHP 확장이 필요합니다.');
    }
    $handle = curl_init($url);
    $options = array(
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_FOLLOWLOCATION => false,
    );
    if ($body !== null) {
        $options[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($handle, $options);
    $raw = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
    $error = curl_error($handle);
    curl_close($handle);
    if ($raw === false) {
        throw new RuntimeException('Meta API 연결 실패: ' . $error);
    }
    $payload = json_decode($raw, true);
    return array('status' => $status, 'payload' => is_array($payload) ? $payload : array(), 'raw' => $raw);
}

function ik_redirect(string $location): void
{
    header('Cache-Control: no-store, private');
    header('Location: ' . $location, true, 302);
    exit;
}

function ik_safe_return_to(string $returnTo): string
{
    return in_array($returnTo, array('#admin', '#instagram-connect'), true) ? $returnTo : '#instagram-connect';
}

function ik_find_connection(PDO $pdo, ?int $connectionId = null): ?array
{
    if ($connectionId !== null) {
        $statement = $pdo->prepare('SELECT * FROM instagram_connections WHERE id = :id AND is_active = 1 LIMIT 1');
        $statement->execute(array(':id' => $connectionId));
    } else {
        $statement = $pdo->query('SELECT * FROM instagram_connections WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1');
    }
    $row = $statement->fetch();
    return is_array($row) ? $row : null;
}

function ik_audit(PDO $pdo, string $action, array $details = array()): void
{
    try {
        ik_start_session();
        $statement = $pdo->prepare('INSERT INTO admin_audit_logs (admin_id, action, details_json, ip_address) VALUES (:admin_id, :action, :details_json, :ip_address)');
        $statement->execute(array(
            ':admin_id' => isset($_SESSION['ik_admin_id']) ? (string) $_SESSION['ik_admin_id'] : 'system',
            ':action' => $action,
            ':details_json' => json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':ip_address' => substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64),
        ));
    } catch (Throwable $error) {
        error_log('[Influencer Korea Audit] ' . $error->getMessage());
    }
}

function ik_is_valid_webhook_signature(string $rawBody, array $config): bool
{
    $signature = (string) ($_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '');
    if (strpos($signature, 'sha256=') !== 0) {
        return false;
    }
    $expected = 'sha256=' . hash_hmac('sha256', $rawBody, ik_config_value($config, 'meta_app_secret'));
    return hash_equals($expected, $signature);
}
