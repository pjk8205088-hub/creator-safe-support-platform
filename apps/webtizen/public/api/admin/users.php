<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
$query = trim((string) ($_GET['q'] ?? ''));
$sql = 'SELECT id, email, display_name, role, grade, profile_image, instagram_id, youtube_url, created_at FROM ik_users';
$params = array();
if ($query !== '') {
    $sql .= ' WHERE email LIKE :q OR display_name LIKE :q OR role LIKE :q';
    $params[':q'] = '%' . $query . '%';
}
$sql .= ' ORDER BY created_at DESC LIMIT 200';
$statement = $pdo->prepare($sql);
$statement->execute($params);
ik_admin_json(200, array('ok' => true, 'users' => $statement->fetchAll()));
