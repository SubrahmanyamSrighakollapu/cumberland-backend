-- ================================================================
-- 0005_hero_slides_expand.sql
-- Idempotent migration: expands legacy 6-column hero_slides
-- (id, image, alt, sort_order, is_published, created_at)
-- to the new 13-column per-slide-content shape.
-- Safe on fresh schema.sql imports (table already has new DDL → all
-- guards become no-ops). Safe on existing DBs with seed data.
-- ================================================================

SET @dbname = DATABASE();

-- Step 1: Add `slug` column (if missing). We'll fill it before adding unique key.
SET @have_slug = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'hero_slides'
    AND COLUMN_NAME  = 'slug'
);
SET @sql = IF(@have_slug = 0,
  "ALTER TABLE hero_slides
   ADD COLUMN slug VARCHAR(80) NULL
   AFTER `id`",
  "SELECT 'slug column already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 2: Add new text columns (nullable first → will upgrade to NOT NULL
-- after backfill to avoid data loss on existing empty rows).
SET @have_eyebrow = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'hero_slides'
    AND COLUMN_NAME  = 'eyebrow'
);
SET @sql = IF(@have_eyebrow = 0,
  "ALTER TABLE hero_slides
   ADD COLUMN eyebrow        VARCHAR(80)  NULL AFTER `alt`,
   ADD COLUMN heading_line_1 VARCHAR(100) NULL AFTER `eyebrow`,
   ADD COLUMN heading_line_2 VARCHAR(100) NULL AFTER `heading_line_1`,
   ADD COLUMN description    VARCHAR(500) NULL AFTER `heading_line_2`",
  "SELECT 'text columns already exist' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 3: Add updated_at column if missing.
SET @have_updated_at = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'hero_slides'
    AND COLUMN_NAME  = 'updated_at'
);
SET @sql = IF(@have_updated_at = 0,
  "ALTER TABLE hero_slides
   ADD COLUMN updated_at DATETIME NOT NULL
     DEFAULT CURRENT_TIMESTAMP
     ON UPDATE CURRENT_TIMESTAMP
   AFTER `created_at`",
  "SELECT 'updated_at already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 4: Backfill default slug + text for rows that have NULLs.
-- If a row has no slug, derive from id: "hero-slide-{id}".
UPDATE hero_slides SET slug = CONCAT('hero-slide-', id)
  WHERE slug IS NULL OR slug = '';
-- If a row has no eyebrow/headings/desc, apply the static default content
-- so the hero always displays something meaningful.
UPDATE hero_slides
  SET
    eyebrow        = COALESCE(NULLIF(eyebrow, ''),        'Boutique Waterfront Retreat'),
    heading_line_1 = COALESCE(NULLIF(heading_line_1, ''), 'Make room for'),
    heading_line_2 = COALESCE(NULLIF(heading_line_2, ''), 'the good days.'),
    description    = COALESCE(NULLIF(description, ''),
      'Boutique coastal stays, warmer days and unforgettable moments by the water.')
  WHERE eyebrow IS NULL
     OR heading_line_1 IS NULL
     OR heading_line_2 IS NULL
     OR description IS NULL
     OR eyebrow = ''
     OR heading_line_1 = ''
     OR heading_line_2 = ''
     OR description = '';

-- Step 5: Now promote all the just-backfilled columns to NOT NULL
-- and fill in defaults for the slug column in case of new inserts.
SET @sql = IF(@have_slug = 0 OR (
  SELECT IF(IS_NULLABLE = 'YES', 1, 0) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'hero_slides' AND COLUMN_NAME = 'slug' LIMIT 1
) = 1,
  "ALTER TABLE hero_slides MODIFY COLUMN slug VARCHAR(80) NOT NULL",
  "SELECT 'slug already NOT NULL' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(@have_eyebrow = 0 OR (
  SELECT IF(IS_NULLABLE = 'YES', 1, 0) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'hero_slides' AND COLUMN_NAME = 'eyebrow' LIMIT 1
) = 1,
  "ALTER TABLE hero_slides
   MODIFY COLUMN eyebrow        VARCHAR(80)  NOT NULL,
   MODIFY COLUMN heading_line_1 VARCHAR(100) NOT NULL,
   MODIFY COLUMN heading_line_2 VARCHAR(100) NOT NULL,
   MODIFY COLUMN description    VARCHAR(500) NOT NULL",
  "SELECT 'text columns already NOT NULL' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 6: Drop the old single-column UNIQUE(slug) index if it exists,
-- then re-add it (so we guarantee it's present regardless of prior state).
SET @uk_count = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'hero_slides'
    AND INDEX_NAME   = 'uk_slug'
);
SET @sql = IF(@uk_count > 0,
  "ALTER TABLE hero_slides DROP INDEX `uk_slug`",
  "SELECT 'uk_slug not present yet, will add' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = "ALTER TABLE hero_slides ADD UNIQUE KEY uk_slug (slug)";
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 7: Add lookup indexes if absent.
SET @idx_pub = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'hero_slides'
    AND INDEX_NAME   = 'idx_published'
);
SET @sql = IF(@idx_pub = 0,
  "ALTER TABLE hero_slides ADD KEY idx_published (is_published)",
  "SELECT 'idx_published already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_sort = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME   = 'hero_slides'
    AND INDEX_NAME   = 'idx_sort_order'
);
SET @sql = IF(@idx_sort = 0,
  "ALTER TABLE hero_slides ADD KEY idx_sort_order (sort_order)",
  "SELECT 'idx_sort_order already exists' AS msg"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
