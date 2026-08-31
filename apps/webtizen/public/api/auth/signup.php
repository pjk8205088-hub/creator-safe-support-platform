<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ik_admin_json(405, array('ok' => false, 'message' => 'POST 요청만 허용됩니다.'));
}

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
$body = ik_admin_read_json();
$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');
$displayName = trim((string) ($body['name'] ?? $body['displayName'] ?? ''));
$role = strtoupper(trim((string) ($body['role'] ?? 'FAN')));
if (!in_array($role, array('FAN', 'CREATOR'), true)) {
    $role = 'FAN';
}
if ($email === '' || $displayName === '') {
    ik_admin_json(400, array('ok' => false, 'message' => '이메일과 이름을 입력해 주세요.'));
}

$hash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : null;
$statement = $pdo->prepare('INSERT INTO ik_users (email, password_hash, display_name, role, grade, profile_image, instagram_id, youtube_url, bio) VALUES (:email, :password_hash, :display_name, :role, :grade, :profile_image, :instagram_id, :youtube_url, :bio)');
$statement->execute(array(
    ':email' => $email,
    ':password_hash' => $hash,
    ':display_name' => $displayName,
    ':role' => $role,
    ':grade' => 'C',
    ':profile_image' => (string) ($body['profileImage'] ?? ''),
    ':instagram_id' => (string) ($body['instagramId'] ?? ''),
    ':youtube_url' => (string) ($body['youtubeUrl'] ?? ''),
    ':bio' => (string) ($body['bio'] ?? ''),
));
$userId = (int) $pdo->lastInsertId();
if ($role === 'CREATOR') {
    $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', (string) ($body['creatorSlug'] ?? $displayName)));
    $slug = trim($slug ?: 'creator-' . $userId, '-');
    $creator = $pdo->prepare('INSERT INTO ik_creators (user_id, slug, display_name, handle, bio, category, platform, avatar_url, cover_url, instagram_id, youtube_url) VALUES (:user_id, :slug, :display_name, :handle, :bio, :category, :platform, :avatar_url, :cover_url, :instagram_id, :youtube_url)');
    $creator->execute(array(
        ':user_id' => $userId,
        ':slug' => $slug,
        ':display_name' => $displayName,
        ':handle' => '@' . ($body['instagramId'] ?? $slug),
        ':bio' => (string) ($body['bio'] ?? '인플러언서 코리아 크리에이터입니다.'),
        ':category' => 'creator',
        ':platform' => 'Instagram',
        ':avatar_url' => (string) ($body['profileImage'] ?? '/influencers/trendy-influencers-wall.png'),
        ':cover_url' => (string) ($body['profileImage'] ?? '/influencers/trendy-influencers-wall.png'),
        ':instagram_id' => (string) ($body['instagramId'] ?? ''),
        ':youtube_url' => (string) ($body['youtubeUrl'] ?? ''),
    ));
}

ik_admin_json(201, array(
    'token' => 'webtizen_' . $userId,
    'user' => array('id' => (string) $userId, 'name' => $displayName, 'email' => $email, 'role' => $role)
));
