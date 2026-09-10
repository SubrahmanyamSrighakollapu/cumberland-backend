-- ============================================================
-- MIGRATION 0001 — Remove duration from gallery_media
-- (Plus future 2MB image-upload system; duration is obsolete)
-- Run in PHPMyAdmin after import of schema.sql or on an
-- existing installation that already has gallery_media table.
-- ============================================================

USE cumberland_motor_inn;

-- Drop duration column only if it exists to keep the SQL
-- idempotent on newer installs that don't have it yet.
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'gallery_media'
    AND COLUMN_NAME  = 'duration'
);

SET @sql = IF(@col_exists > 0,
  'ALTER TABLE gallery_media DROP COLUMN duration',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
