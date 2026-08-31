<?php
declare(strict_types=1);
require_once __DIR__ . '/admin/_bootstrap.php';

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
$slug = trim((string) ($_GET['slug'] ?? ''));
$sql = "SELECT id, slug, display_name AS displayName, handle, bio, category AS categoryId, platform, avatar_url AS avatarUrl, cover_url AS coverUrl, CONCAT('서울 ', LEFT(slug, 2), '**') AS addressMasked FROM ik_creators WHERE is_active = 1";
$params = array();
if ($slug !== '') {
    $sql .= ' AND slug = :slug';
    $params[':slug'] = $slug;
}
$sql .= ' ORDER BY id DESC';
$statement = $pdo->prepare($sql);
$statement->execute($params);
$creators = $statement->fetchAll();
foreach ($creators as &$creator) {
    $creator['wishlist'] = array(
        array('id' => 'dm-pass', 'title' => '프리미엄 DM 이용권', 'price' => 10000, 'categoryId' => 'digital', 'imageUrl' => $creator['avatarUrl'], 'note' => '크리에이터에게 메시지를 보낼 수 있습니다.'),
        array('id' => 'club-content', 'title' => '클럽 콘텐츠 패스', 'price' => 30000, 'categoryId' => 'digital', 'imageUrl' => $creator['coverUrl'], 'note' => '한정 공개 콘텐츠와 팬 알림을 이용합니다.')
    );
}
if ($slug !== '') {
    if (count($creators) < 1) {
        ik_admin_json(404, array('code' => 'CREATOR_NOT_FOUND'));
    }
    ik_admin_json(200, $creators[0]);
}
ik_admin_json(200, $creators);
