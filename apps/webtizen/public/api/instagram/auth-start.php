<?php
declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ik_json(405, array('ok' => false, 'message' => 'GET 요청만 허용됩니다.'));
}

ik_require_admin();
$config = ik_require_config();

try {
    $appId = ik_config_value($config, 'meta_app_id');
    $redirectUri = ik_config_value($config, 'meta_redirect_uri');
    $authorizeUrl = isset($config['meta_authorize_url']) && $config['meta_authorize_url'] !== ''
        ? (string) $config['meta_authorize_url']
        : 'https://www.instagram.com/oauth/authorize';
    $state = bin2hex(random_bytes(32));
} catch (Throwable $error) {
    error_log('[Influencer Korea OAuth start] ' . $error->getMessage());
    ik_json(503, array('ok' => false, 'message' => 'Meta OAuth 서버 설정이 아직 완료되지 않았습니다.'));
}

$_SESSION['instagram_oauth_state'] = $state;
$_SESSION['instagram_oauth_state_expires_at'] = time() + 600;
$_SESSION['instagram_return_to'] = ik_safe_return_to((string) ($_GET['return_to'] ?? '#instagram-connect'));

$query = http_build_query(array(
    'client_id' => $appId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'scope' => 'instagram_business_basic,instagram_business_manage_messages',
    'state' => $state,
), '', '&', PHP_QUERY_RFC3986);

ik_redirect($authorizeUrl . (strpos($authorizeUrl, '?') === false ? '?' : '&') . $query);
