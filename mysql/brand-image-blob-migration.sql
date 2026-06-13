-- Store generated brand images in MySQL (required on Vercel — no writable local disk).
-- Run in phpMyAdmin on your Hostinger database, then redeploy.

CREATE TABLE IF NOT EXISTS brand_image_blobs (
  brand_image_id VARCHAR(36)  NOT NULL,
  kind             VARCHAR(10) NOT NULL,
  mime_type        VARCHAR(100) NOT NULL,
  data             LONGBLOB     NOT NULL,
  PRIMARY KEY (brand_image_id, kind),
  CONSTRAINT fk_brand_image_blobs_image
    FOREIGN KEY (brand_image_id) REFERENCES brand_images (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
