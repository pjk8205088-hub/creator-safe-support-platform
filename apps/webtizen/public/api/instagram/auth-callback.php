<?php
declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

ik_start_session();
$returnTo = ik_safe_return_to((string) ($_SESSION['instagram_return_to'] ?? '#instagram-connect'));
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ik_redirect('/?instagram_error=1' . $returnTo);
}

$state = (string) ($_GET['state'] ?? '');
$expectedState = (string) ($_SESSION['instagram_oauth_state'] ?? '');
$expiresAt = (int) ($_SESSION['instagram_oauth_state_expires_at'] ?? 0);
$code = (string) ($_GET['code'] ?? '');
unset($_SESSION['instagram_oauth_state'], $_SESSION['instagram_oauth_state_expires_at']);

if ($code === '' || $state === '' || $expectedState === '' || $expiresAt < time() || !hash_equals($expectedState, $state) || empty($_SESSION['ik_admin_id'])) {
    ik_redirect('/?instagram_error=1' . $returnTo);
}

$config = ik_require_config();
try {
    $appId = ik_config_value($config, 'meta_app_id');
    $appSecret = ik_config_value($config, 'meta_app_secret');
    $redirectUri = ik_config_value($config, 'meta_redirect_uri');
    $tokenUrl = isset($config['meta_token_url']) && $config['meta_token_url'] !== ''
        ? (string) $config['meta_token_url']
        : 'https://api.instagram.com/oauth/access_token';
    $graphUrl = isset($config['meta_graph_url']) && $config['meta_graph_url'] !== ''
        ? rtrim((string) $config['meta_graph_url'], '/')
        : 'https://graph.instagram.com';

    $tokenResult = ik_http_request($tokenUrl, 'POST', array('Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'), http_build_query(array(
        'client_id' => $appId,
        'client_secret' => $appSecret,
        'grant_type' => 'authorization_code',
        'redirect_uri' => $redirectUri,
        'code' => $code,
    ), '', '&', PHP_QUERY_RFC3986));
    if ($tokenResult['status'] < 200 || $tokenResult['status'] >= 300 || empty($tokenResult['payload']['access_token'])) {
        throw new RuntimeException('Meta token exchange failed.');
    }
    $accessToken = (string) $tokenResult['payload']['access_token'];
    $profileResult = ik_http_request($graphUrl . '/me?fields=user_id%2Cusername%2Caccount_type', 'GET', array(
        'Authorization: Bearer ' . $accessToken,
        'Accept: application/json',
    ));
    if ($profileResult['status'] < 200 || $profileResult['status'] >= 300) {
        throw new RuntimeException('Meta profile lookup failed.');
    }
    $profile = $profileResult['payload'];
    $instagramUserId = (string) ($profile['user_id'] ?? $profile['id'] ?? $tokenResult['payload']['user_id'] ?? '');
    if ($instagramUserId === '') {
        throw new RuntimeException('Meta profile did not return a professional account ID.');
    }

    $pdo = ik_require_db($config);
    $expiresAtValue = null;
    if (!empty($tokenResult['payload']['expires_in']) && (int) $tokenResult['payload']['expires_in'] > 0) {
        $expiresAtValue = gmdate('Y-m-d H:i:s', time() + (int) $tokenResult['payload']['expires_in']);
    }
    $statement = $pdo->prepare('INSERT INTO instagram_connections (instagram_user_id, username, account_type, token_ciphertext, granted_scopes, token_expires_at, connected_by, is_active) VALUES (:instagram_user_id, :username, :account_type, :token_ciphertext, :granted_scopes, :token_expires_at, :connected_by, 1) ON DUPLICATE KEY UPDATE username = VALUES(username), account_type = VALUES(account_type), token_ciphertext = VALUES(token_ciphertext), granted_scopes = VALUES(granted_scopes), token_expires_at = VALUES(token_expires_at), connected_by = VALUES(connected_by), is_active = 1, updated_at = CURRENT_TIMESTAMP');
    $statement->execute(array(
        ':instagram_user_id' => substr($instagramUserId, 0, 80),
        ':username' => substr((string) ($profile['username'] ?? ''), 0, 191),
        ':account_type' => substr((string) ($profile['account_type'] ?? 'PROFESSIONAL'), 0, 50),
        ':token_ciphertext' => ik_encrypt($accessToken, $config),
        ':granted_scopes' => 'instagram_business_basic,instagram_business_manage_messages',
        ':token_expires_at' => $expiresAtValue,
        ':connected_by' => (string) $_SESSION['ik_admin_id'],
    ));
    ik_audit($pdo, 'instagram.oauth.connected', array('instagram_user_id' => $instagramUserId));
} catch (Throwable $error) {
    error_log('[Influencer Korea OAuth callback] ' . $error->getMessage());
    ik_redirect('/?instagram_error=1' . $returnTo);
}

ik_redirect('/?instagram_connected=1' . $returnTo);
