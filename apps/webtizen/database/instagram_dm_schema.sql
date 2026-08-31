-- Influencer Korea: Instagram DM server data
-- Import this file into the MySQL database selected in the Webtizen hosting panel.

CREATE TABLE IF NOT EXISTS instagram_connections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  instagram_user_id VARCHAR(80) NOT NULL,
  username VARCHAR(191) NOT NULL DEFAULT '',
  account_type VARCHAR(50) NOT NULL DEFAULT 'PROFESSIONAL',
  token_ciphertext LONGTEXT NOT NULL,
  granted_scopes VARCHAR(500) NOT NULL DEFAULT '',
  token_expires_at DATETIME NULL,
  connected_by VARCHAR(191) NOT NULL,
  last_webhook_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_instagram_connections_user (instagram_user_id),
  KEY idx_instagram_connections_active (is_active, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS instagram_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  connection_id BIGINT UNSIGNED NOT NULL,
  recipient_igsid VARCHAR(120) NOT NULL,
  last_inbound_at DATETIME NOT NULL,
  last_event_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_instagram_conversation (connection_id, recipient_igsid),
  KEY idx_instagram_conversation_window (connection_id, recipient_igsid, last_inbound_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS instagram_message_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  connection_id BIGINT UNSIGNED NOT NULL,
  recipient_igsid VARCHAR(120) NOT NULL,
  direction ENUM('inbound', 'outbound') NOT NULL,
  message_ciphertext LONGTEXT NULL,
  message_preview VARCHAR(191) NOT NULL DEFAULT '',
  meta_message_id VARCHAR(191) NOT NULL DEFAULT '',
  delivery_status VARCHAR(40) NOT NULL,
  retained_until DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_instagram_message_logs_connection (connection_id, created_at),
  KEY idx_instagram_message_logs_retention (retained_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS instagram_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payload_hash CHAR(64) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_instagram_webhook_events_hash (payload_hash),
  KEY idx_instagram_webhook_events_received (received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id VARCHAR(191) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details_json TEXT NULL,
  ip_address VARCHAR(64) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_audit_logs_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
