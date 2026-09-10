-- ================================================================
-- 0004_amenities_add_category.sql
-- Idempotent migration: upgrades legacy 6-column home-only amenities
-- table to the new dual-category (home / room) single-table shape.
-- Safe on fresh DB (schema.sql already has new DDL) → all no-ops.
-- ================================================================

SET @dbname = DATABASE();

-- 1) Add `category` column if missing
SET @have_category = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND COLUMN_NAME  = 'category'
);
SET @sql = IF(@have_category = 0,
  "ALTER TABLE amenities
   ADD COLUMN category ENUM('home','room') NOT NULL DEFAULT 'home'
   AFTER `id`",
  "SELECT 'category column already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Ensure all existing rows have category=home before making
--    the unique key (so historic rows don't duplicate on slug).
UPDATE amenities SET category = 'home' WHERE category IS NULL
  OR category NOT IN ('home','room');

-- 3) Add `icon_key` column if missing
SET @have_icon_key = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND COLUMN_NAME  = 'icon_key'
);
SET @sql = IF(@have_icon_key = 0,
  "ALTER TABLE amenities
   ADD COLUMN icon_key VARCHAR(40) NOT NULL
   AFTER `description`",
  "SELECT 'icon_key column already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Backfill icon_key values from legacy icon_name column
--    (icon_key superset of icon_name enum, 1:1 names).
SET @have_icon_name = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND COLUMN_NAME  = 'icon_name'
);
SET @sql = IF(@have_icon_name = 1,
  "UPDATE amenities SET icon_key = icon_name
   WHERE icon_key IS NULL OR icon_key = ''",
  "SELECT 'no icon_name to backfill' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5) Make description nullable (room amenity descriptions optional)
SET @desc_nullable = (
  SELECT IF(IS_NULLABLE = 'YES', 1, 0) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND COLUMN_NAME  = 'description'
  LIMIT 1
);
SET @sql = IF(@desc_nullable <> 1,
  "ALTER TABLE amenities MODIFY COLUMN description VARCHAR(255) NULL",
  "SELECT 'description already nullable' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6) Drop old `icon_name` enum column if present
SET @sql = IF(@have_icon_name = 1,
  "ALTER TABLE amenities DROP COLUMN icon_name",
  "SELECT 'icon_name column already gone' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7) Drop the old single-column UNIQUE(slug) constraint if it exists,
--    then add the new composite UNIQUE(slug, category).
SET @old_unique_cols = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND INDEX_NAME   = 'slug'
);
SET @sql = IF(@old_unique_cols > 0,
  "ALTER TABLE amenities DROP INDEX `slug`",
  "SELECT 'no old single-column slug unique key' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @composite_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND INDEX_NAME   = 'uk_slug_category'
);
SET @sql = IF(@composite_exists = 0,
  "ALTER TABLE amenities
   ADD UNIQUE KEY uk_slug_category (slug, category)",
  "SELECT 'uk_slug_category already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8) Add lookup indexes if absent
SET @idx_category = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND INDEX_NAME   = 'idx_category'
);
SET @sql = IF(@idx_category = 0,
  "ALTER TABLE amenities ADD KEY idx_category (category)",
  "SELECT 'idx_category already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_published = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'amenities'
    AND INDEX_NAME   = 'idx_published'
);
SET @sql = IF(@idx_published = 0,
  "ALTER TABLE amenities ADD KEY idx_published (is_published)",
  "SELECT 'idx_published already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
