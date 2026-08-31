<?php
declare(strict_types=1);

function ik_admin_json(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ik_admin_read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return array();
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : array();
}

function ik_admin_config(): array
{
    $path = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'ik-mysql.php';
    if (!is_file($path)) {
        ik_admin_json(503, array('ok' => false, 'message' => 'MySQL 설정 파일 config/ik-mysql.php가 필요합니다.'));
    }
    $config = require $path;
    if (!is_array($config)) {
        ik_admin_json(503, array('ok' => false, 'message' => 'MySQL 설정 파일 형식이 올바르지 않습니다.'));
    }
    return $config;
}

function ik_admin_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $config = ik_admin_config();
    $db = isset($config['db']) && is_array($config['db']) ? $config['db'] : array();
    $host = (string) ($db['host'] ?? 'localhost');
    $port = (string) ($db['port'] ?? '3306');
    $name = (string) ($db['name'] ?? '');
    $user = (string) ($db['username'] ?? '');
    $pass = (string) ($db['password'] ?? '');
    if ($name === '' || $user === '') {
        ik_admin_json(503, array('ok' => false, 'message' => 'MySQL DB 이름과 계정 설정이 필요합니다.'));
    }
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $pass, array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ));
    } catch (Throwable $error) {
        error_log('[Influencer Korea Admin DB] ' . $error->getMessage());
        ik_admin_json(503, array('ok' => false, 'message' => 'MySQL 데이터베이스 연결을 확인해 주세요.'));
    }
    return $pdo;
}

function ik_admin_commission_rate(PDO $pdo): float
{
    $statement = $pdo->prepare("SELECT setting_value FROM ik_admin_settings WHERE setting_key = 'commission_rate' LIMIT 1");
    $statement->execute();
    $value = $statement->fetchColumn();
    $rate = is_numeric($value) ? (float) $value : 25.0;
    return max(1.0, min(100.0, $rate));
}

function ik_admin_seed_if_empty(PDO $pdo): void
{
    $count = (int) $pdo->query('SELECT COUNT(*) FROM ik_creators')->fetchColumn();
    if ($count > 0) {
        return;
    }
    $pdo->exec("INSERT INTO ik_creators (slug, display_name, handle, bio, category, platform, avatar_url, cover_url, instagram_id, youtube_url) VALUES
        ('kang-su-a', '강수아', '@sua.daily', '맑고 깨끗한 데일리룩과 뷰티 콘텐츠를 전하는 크리에이터입니다.', 'beauty', 'Instagram', '/influencers/kang-su-a.png', '/influencers/kang-su-a.png', 'sua.daily', ''),
        ('lee-ji-yun', '이지윤', '@jiyun.night', '보랏빛 밤 감성과 스타일링을 나누는 패션 크리에이터입니다.', 'fashion', 'Instagram', '/influencers/lee-ji-yun.png', '/influencers/lee-ji-yun.png', 'jiyun.night', ''),
        ('kim-do-jin', '김도진', '@dojin.street', '스트릿 패션과 에너지를 보여주는 댄스/패션 크리에이터입니다.', 'street', 'YouTube', '/influencers/kim-do-jin.png', '/influencers/kim-do-jin.png', 'dojin.street', '')");
    $pdo->exec("INSERT IGNORE INTO ik_admin_settings (setting_key, setting_value) VALUES ('commission_rate', '25')");
}
