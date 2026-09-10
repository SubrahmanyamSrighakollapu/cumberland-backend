-- =====================================================================
-- Migration 0002: Add contact_inquiries.extra_json column (idempotent)
-- Stores optional structured extra fields e.g. arrival/departure dates
-- from the contact form.
-- =====================================================================

USE cumberland_motor_inn;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'contact_inquiries'
    AND COLUMN_NAME  = 'extra_json'
);

SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE contact_inquiries ADD COLUMN extra_json JSON NULL AFTER reply_sent',
  'SELECT ''extra_json column already exists on contact_inquiries'' AS note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
