-- Admin-controlled credits & tool access (run in phpMyAdmin on u998538981_writeguard)
-- Safe to run multiple times (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS user_access (
  user_id        VARCHAR(36)  NOT NULL PRIMARY KEY,
  credit_limit   INT          NULL COMMENT 'NULL=use plan, -1=unlimited, 0=none, N=monthly cap',
  tools_mode     ENUM('locked', 'all', 'plan', 'tier') NOT NULL DEFAULT 'locked',
  feature_tier   ENUM('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE') NULL,
  admin_notes    TEXT         NULL,
  granted_by_id  VARCHAR(36)  NULL,
  expires_at     DATETIME(3)  NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_user_access_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_access_granted_by FOREIGN KEY (granted_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
