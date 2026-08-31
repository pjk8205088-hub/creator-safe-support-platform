<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ik_admin_json(405, array('ok' => false, 'message' => 'POST 요청만 허용됩니다.'));
}

$pdo = ik_admin_db();
$body = ik_admin_read_json();
$orderNo = (string) ($body['orderId'] ?? '');
$paymentKey = (string) ($body['paymentKey'] ?? '');
$statement = $pdo->prepare("UPDATE ik_payment_orders SET status = 'PAID', paid_at = NOW(), payment_key = :payment_key WHERE order_no = :order_no");
$statement->execute(array(':payment_key' => $paymentKey, ':order_no' => $orderNo));
if ($statement->rowCount() < 1) {
    ik_admin_json(404, array('ok' => false, 'message' => '주문을 찾을 수 없습니다.'));
}
$select = $pdo->prepare('SELECT * FROM ik_payment_orders WHERE order_no = :order_no LIMIT 1');
$select->execute(array(':order_no' => $orderNo));
ik_admin_json(200, array('ok' => true, 'order' => $select->fetch()));
