<?php
// Copy this file OUTSIDE public_html as ik-secrets.php. Do not upload the real file to GitHub or a public folder.
return array(
    'admin_email' => '',
    'admin_password_hash' => '', // Generate with PHP password_hash('your password', PASSWORD_DEFAULT).

    'meta_app_id' => '',
    'meta_app_secret' => '',
    'meta_webhook_verify_token' => '',
    'meta_redirect_uri' => 'https://www.eon8.co.kr/api/instagram/auth-callback.php',
    'meta_authorize_url' => 'https://www.instagram.com/oauth/authorize',
    'meta_token_url' => 'https://api.instagram.com/oauth/access_token',
    'meta_graph_url' => 'https://graph.instagram.com',
    'token_encryption_key' => '', // At least 32 unpredictable characters. Keep this permanently secret.

    'db' => array(
        'dsn' => 'mysql:host=YOUR_DB_HOST;port=3306;dbname=YOUR_DB_NAME;charset=utf8mb4',
        'username' => 'YOUR_DB_USER',
        'password' => 'YOUR_DB_PASSWORD',
    ),
);
