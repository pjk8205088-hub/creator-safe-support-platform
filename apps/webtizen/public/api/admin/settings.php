<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

$pdo = ik_admin_db();
ik_admin_seed_if_empty($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = ik_admin_read_json();
    $rate = (float) ($body['commissionRate'] ?? 25);
    $rate = max(1, min(100, $rate));
    $statement = $pdo->prepare("INSERT INTO ik_admin_settings (setting_key, setting_value) VALUES ('commission_rate', :rate) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    $statement->execute(array(':rate' => (string) $rate));
    ik_admin_json(200, array('ok' => true, 'commissionRate' => $rate));
}

ik_admin_json(200, array('ok' => true, 'commissionRate' => ik_admin_commission_rate($pdo)));
