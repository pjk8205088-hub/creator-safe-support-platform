<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);
$query = trim((string) ($_GET['q'] ?? ''));
$sql = "SELECT o.id, o.order_no, c.display_name AS creator_name, c.handle AS creator_handle, o.supporter_name, o.supporter_email, o.message, o.amount, o.payment_provider, o.status, o.commission_rate, o.admin_fee, o.creator_payout, o.payout_status, o.paid_at, o.created_at
        FROM ik_payment_orders o
        JOIN ik_creators c ON c.id = o.creator_id";
$params = array();
if ($query !== '') {
    $sql .= ' WHERE c.display_name LIKE :q OR c.handle LIKE :q OR o.supporter_name LIKE :q OR o.supporter_email LIKE :q OR o.order_no LIKE :q';
    $params[':q'] = '%' . $query . '%';
}
$sql .= ' ORDER BY o.created_at DESC LIMIT 300';
$statement = $pdo->prepare($sql);
$statement->execute($params);
ik_admin_json(200, array('ok' => true, 'payments' => $statement->fetchAll(), 'commissionRate' => ik_admin_commission_rate($pdo)));
