<?php
declare(strict_types=1);
require_once __DIR__ . '/admin/_bootstrap.php';

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
$statement = $pdo->query("SELECT o.order_no AS id, o.creator_id AS creatorId, c.display_name AS creatorName, c.handle AS creatorHandle, o.supporter_name AS supporterName, o.supporter_email AS supporterEmail, o.message, o.amount, o.payment_provider AS paymentProvider, o.payment_key AS paymentKey, o.status, o.admin_fee AS adminFee, o.creator_payout AS creatorPayout, 'ADMIN_DASHBOARD' AS payoutDestination, o.payout_status AS payoutStatus, o.created_at AS createdAt FROM ik_payment_orders o JOIN ik_creators c ON c.id = o.creator_id ORDER BY o.created_at DESC LIMIT 300");
ik_admin_json(200, $statement->fetchAll());
