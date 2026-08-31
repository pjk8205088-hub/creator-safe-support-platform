# Webtizen PHP/MySQL backend

This folder contains the PHP API files intended for Webtizen shared hosting. The frontend calls `/api/...`; on Webtizen those paths are served by these PHP files and persist data in MySQL.

## Install

1. Upload `public/api`, `public/config`, and the exported frontend files to the Webtizen web root. Keep `public/api/.htaccess` so extensionless frontend API calls resolve to PHP files.
2. Copy `public/config/ik-mysql.example.php` to `public/config/ik-mysql.php`.
3. Fill in the Webtizen MySQL host, database name, username, and password.
4. Import `database/webtizen-mysql-admin-schema.sql` in phpMyAdmin.

## Admin Features

- Dashboard summary: `GET /api/admin/summary.php`
- Fan/member list: `GET /api/admin/users.php`
- Influencer list and edit: `GET|POST /api/admin/creators.php`
- Payment list: `GET /api/admin/payments.php`
- Commission settings: `GET|POST /api/admin/settings.php`
- Fan/influencer signup: `POST /api/auth/signup.php`
- Payment order and confirmation: `POST /api/payments/orders.php`, `POST /api/payments/confirm.php`

The current public preview keeps admin login open for testing. Before final production review, connect the login screen to a real server-side admin session and restore strict credentials.
