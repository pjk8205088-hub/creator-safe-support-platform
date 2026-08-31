<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ik_admin_json(405, array('ok' => false, 'message' => 'POST 요청만 허용됩니다.'));
}

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
$body = ik_admin_read_json();
$creatorId = (int) ($body['creatorId'] ?? 0);
if ($creatorId <= 0 && isset($body['creatorSlug'])) {
    $statement = $pdo->prepare('SELECT id FROM ik_creators WHERE slug = :slug LIMIT 1');
    $statement->execute(array(':slug' => (string) $body['creatorSlug']));
    $creatorId = (int) $statement->fetchColumn();
}
if ($creatorId <= 0) {
    $creatorId = (int) $pdo->query('SELECT id FROM ik_creators ORDER BY id ASC LIMIT 1')->fetchColumn();
}
$amount = max(1000, (int) ($body['amount'] ?? 0));
$rate = ik_admin_commission_rate($pdo);
$adminFee = (int) round($amount * $rate / 100);
$creatorPayout = $amount - $adminFee;
$orderNo = 'IK' . date('YmdHis') . random_int(100, 999);
$statement = $pdo->prepare('INSERT INTO ik_payment_orders (order_no, creator_id, supporter_name, supporter_email, message, amount, payment_provider, payment_key, status, commission_rate, admin_fee, creator_payout) VALUES (:order_no, :creator_id, :supporter_name, :supporter_email, :message, :amount, :payment_provider, :payment_key, :status, :commission_rate, :admin_fee, :creator_payout)');
$paymentKey = 'pending_' . bin2hex(random_bytes(6));
$statement->execute(array(
    ':order_no' => $orderNo,
    ':creator_id' => $creatorId,
    ':supporter_name' => trim((string) ($body['supporterName'] ?? '팬')),
    ':supporter_email' => trim((string) ($body['supporterEmail'] ?? '')),
    ':message' => trim((string) ($body['message'] ?? '')),
    ':amount' => $amount,
    ':payment_provider' => trim((string) ($body['paymentProvider'] ?? 'NICEPAY')),
    ':payment_key' => $paymentKey,
    ':status' => 'PENDING_PAYMENT',
    ':commission_rate' => $rate,
    ':admin_fee' => $adminFee,
    ':creator_payout' => $creatorPayout,
));
ik_admin_json(201, array('orderId' => $orderNo, 'paymentKey' => $paymentKey, 'amount' => $amount, 'adminFee' => $adminFee, 'creatorPayout' => $creatorPayout, 'paymentProvider' => 'NICEPAY'));
