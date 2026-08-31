<?php
declare(strict_types=1);
require_once __DIR__ . '/admin/_bootstrap.php';

ik_admin_json(200, array(
    array('id' => 'beauty', 'name' => 'Beauty', 'description' => '뷰티와 데일리 콘텐츠', 'imageUrl' => '/influencers/kang-su-a.png', 'featured' => true, 'creatorCount' => 1, 'wishlistCount' => 2),
    array('id' => 'fashion', 'name' => 'Fashion', 'description' => '패션과 라이프스타일', 'imageUrl' => '/influencers/lee-ji-yun.png', 'featured' => true, 'creatorCount' => 1, 'wishlistCount' => 2),
    array('id' => 'street', 'name' => 'Street', 'description' => '댄스와 스트릿 에너지', 'imageUrl' => '/influencers/kim-do-jin.png', 'featured' => true, 'creatorCount' => 1, 'wishlistCount' => 2),
    array('id' => 'digital', 'name' => 'Digital', 'description' => 'DM, 포인트, 멤버십', 'imageUrl' => '/influencers/trendy-influencers-wall.png', 'featured' => false, 'creatorCount' => 3, 'wishlistCount' => 6)
));
