-- Migration: add optional room JSON/image columns if missing
-- Run only if rooms table was created BEFORE this migration file existed
-- (fresh schema.sql imports already include these; running is safe and idempotent)

SET @dbname = DATABASE();

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'rooms'
    AND COLUMN_NAME  = 'primary_image'
);

SET @sql = IF(@col_exists = 0,
  "ALTER TABLE rooms
     ADD COLUMN primary_image         VARCHAR(255) NULL AFTER highlight_json,
     ADD COLUMN intro_feature_tiles_json JSON      NULL AFTER intro_paragraph2,
     ADD COLUMN gallery_json          JSON         NULL AFTER primary_image,
     ADD COLUMN related_room_ids_json JSON         NULL AFTER gallery_json;",
  "SELECT 'rooms new columns already exist — skipping' AS message;"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
