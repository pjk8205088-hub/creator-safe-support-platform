<?php
declare(strict_types=1);

// Run from a protected cron/CLI context only. It deliberately does not run over HTTP.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_bootstrap.php';

try {
    $config = ik_load_config();
    $pdo = ik_db($config);
    $logs = $pdo->exec('DELETE FROM instagram_message_logs WHERE retained_until < UTC_TIMESTAMP()');
    $events = $pdo->exec('DELETE FROM instagram_webhook_events WHERE received_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)');
    echo "Deleted message logs: {$logs}" . PHP_EOL;
    echo "Deleted webhook event hashes: {$events}" . PHP_EOL;
} catch (Throwable $error) {
    error_log('[Influencer Korea retention] ' . $error->getMessage());
    exit(1);
}
