<?php
declare(strict_types=1);

require_once __DIR__ . '/../instagram/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ik_json(405, array('ok' => false, 'message' => 'POST 요청만 허용됩니다.'));
}

ik_start_session();
$_SESSION = array();
session_destroy();
ik_json(200, array('ok' => true));
