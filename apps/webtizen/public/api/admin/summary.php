<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
$summary = array(
    'creators' => (int) $pdo->query("SELECT COUNT(*) FROM ik_creators WHERE is_active = 1")->fetchColumn(),
    'users' => (int) $pdo->query('SELECT COUNT(*) FROM ik_users')->fetchColumn(),
    'payments' => (int) $pdo->query('SELECT COUNT(*) FROM ik_payment_orders')->fetchColumn(),
    'paidOrders' => (int) $pdo->query("SELECT COUNT(*) FROM ik_payment_orders WHERE status = 'PAID'")->fetchColumn(),
    'revenue' => (int) $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM ik_payment_orders WHERE status = 'PAID'")->fetchColumn(),
    'adminFeeTotal' => (int) $pdo->query("SELECT COALESCE(SUM(admin_fee), 0) FROM ik_payment_orders WHERE status = 'PAID'")->fetchColumn(),
    'creatorPayoutTotal' => (int) $pdo->query("SELECT COALESCE(SUM(creator_payout), 0) FROM ik_payment_orders WHERE status = 'PAID'")->fetchColumn(),
    'commissionRate' => ik_admin_commission_rate($pdo),
);
ik_admin_json(200, array('ok' => true, 'summary' => $summary));
