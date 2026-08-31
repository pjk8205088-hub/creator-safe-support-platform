<?php
declare(strict_types=1);

require_once __DIR__ . '/../instagram/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ik_json(405, array('ok' => false, 'message' => 'POST 요청만 허용됩니다.'));
}

$config = ik_require_config();
try {
    $adminEmail = strtolower(ik_config_value($config, 'admin_email'));
    $passwordHash = ik_config_value($config, 'admin_password_hash');
} catch (Throwable $error) {
    error_log('[Influencer Korea Auth] ' . $error->getMessage());
    ik_json(503, array('ok' => false, 'message' => '관리자 서버 로그인 설정이 아직 완료되지 않았습니다.'));
}

$body = ik_read_json_body();
$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '' || !hash_equals($adminEmail, $email) || !password_verify($password, $passwordHash)) {
    usleep(250000);
    ik_json(401, array('ok' => false, 'message' => '관리자 이메일 또는 비밀번호를 확인해 주세요.'));
}

ik_start_session();
session_regenerate_id(true);
$_SESSION['ik_admin_id'] = $adminEmail;
$_SESSION['ik_admin_authenticated_at'] = time();
ik_json(200, array('ok' => true));
