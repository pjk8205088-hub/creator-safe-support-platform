<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = ik_admin_read_json();
    $id = (int) ($body['id'] ?? 0);
    $fields = array(
        'display_name' => trim((string) ($body['displayName'] ?? '')),
        'handle' => trim((string) ($body['handle'] ?? '')),
        'bio' => trim((string) ($body['bio'] ?? '')),
        'instagram_id' => trim((string) ($body['instagramId'] ?? '')),
        'youtube_url' => trim((string) ($body['youtubeUrl'] ?? '')),
        'is_active' => !empty($body['isActive']) ? 1 : 0,
    );
    if ($id <= 0 || $fields['display_name'] === '') {
        ik_admin_json(400, array('ok' => false, 'message' => '수정할 인플루언서 정보가 부족합니다.'));
    }
    $statement = $pdo->prepare('UPDATE ik_creators SET display_name = :display_name, handle = :handle, bio = :bio, instagram_id = :instagram_id, youtube_url = :youtube_url, is_active = :is_active WHERE id = :id');
    $fields['id'] = $id;
    $statement->execute($fields);
    ik_admin_json(200, array('ok' => true));
}

$query = trim((string) ($_GET['q'] ?? ''));
$sql = 'SELECT id, slug, display_name, handle, bio, category, platform, avatar_url, cover_url, instagram_id, youtube_url, is_active, created_at FROM ik_creators';
$params = array();
if ($query !== '') {
    $sql .= ' WHERE display_name LIKE :q OR handle LIKE :q OR bio LIKE :q OR instagram_id LIKE :q';
    $params[':q'] = '%' . $query . '%';
}
$sql .= ' ORDER BY created_at DESC LIMIT 200';
$statement = $pdo->prepare($sql);
$statement->execute($params);
ik_admin_json(200, array('ok' => true, 'creators' => $statement->fetchAll()));
