-- =====================================================================
-- CUMBERLAND MOTOR INN - CMS DATABASE SCHEMA
-- MySQL / MariaDB  |  charset: utf8mb4_unicode_ci
-- To import in PHPMyAdmin: select database → Import → choose this file
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cumberland_motor_inn
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE cumberland_motor_inn;

-- ---------------------------------------------------------------------
-- 1. ADMIN USERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS admin_users;
CREATE TABLE admin_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_email (email),
  KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. SITE SETTINGS  (one-row configuration table)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS site_settings;
CREATE TABLE site_settings (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_name          VARCHAR(150) NOT NULL DEFAULT 'Cumberland Motor Inn',
  tagline            VARCHAR(255) NOT NULL DEFAULT 'Coastal stays. Brighter days.',
  logo_src           VARCHAR(255) NOT NULL DEFAULT '/images/cumberland-logo.png',
  logo_alt           VARCHAR(255) NOT NULL DEFAULT 'Cumberland Motor Inn Logo',
  logo_width         INT NOT NULL DEFAULT 260,
  logo_height        INT NOT NULL DEFAULT 70,
  phone              VARCHAR(50) NOT NULL DEFAULT '+00 1234 5678',
  phone_raw          VARCHAR(50) NOT NULL DEFAULT 'tel:+0012345678',
  email              VARCHAR(150) NOT NULL DEFAULT 'stay@cumberland.example',
  address            VARCHAR(255) NOT NULL DEFAULT '128 Oceanview Drive, Bayside, NSW 2556',
  short_address      VARCHAR(255) NOT NULL DEFAULT '128 Oceanview Drive, Bayside',
  reception_hours    VARCHAR(100) NOT NULL DEFAULT '7:00 AM – 9:00 PM daily',
  social_instagram   VARCHAR(255) NOT NULL DEFAULT 'https://instagram.com',
  social_facebook    VARCHAR(255) NOT NULL DEFAULT 'https://facebook.com',
  social_youtube     VARCHAR(255) NOT NULL DEFAULT 'https://youtube.com',
  legal_privacy_href VARCHAR(255) NOT NULL DEFAULT '/privacy-policy',
  legal_terms_href   VARCHAR(255) NOT NULL DEFAULT '/terms-and-conditions',
  copyright_text     VARCHAR(255) NOT NULL DEFAULT 'Cumberland Motor Inn © 2026',
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings () VALUES ();

-- ---------------------------------------------------------------------
-- 3. AMENITIES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS amenities;
CREATE TABLE amenities (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(50) NOT NULL UNIQUE,
  title         VARCHAR(100) NOT NULL,
  description   VARCHAR(255) NOT NULL,
  icon_name     ENUM('pool','parking','wifi','ev','kitchen','bbq') NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. ROOMS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug                  VARCHAR(120) NOT NULL UNIQUE,
  name                  VARCHAR(150) NOT NULL,
  eyebrow               VARCHAR(80) NOT NULL DEFAULT 'ROOM COLLECTION',
  short_description     VARCHAR(500) NOT NULL,
  price                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency              CHAR(3) NOT NULL DEFAULT '$',
  price_unit            VARCHAR(20) NOT NULL DEFAULT '/ night',
  capacity_guests       TINYINT UNSIGNED NOT NULL DEFAULT 2,
  guests_label          VARCHAR(30) NOT NULL DEFAULT '2 Guests',
  bed_configuration     VARCHAR(80) NOT NULL,
  area_m2               DECIMAL(8,2) NULL,
  area_label            VARCHAR(30) NULL,
  view_label            VARCHAR(60) NULL,
  balcony_label         VARCHAR(60) NULL,
  seo_title             VARCHAR(200) NULL,
  seo_description       VARCHAR(500) NULL,
  intro_eyebrow         VARCHAR(80) NULL,
  intro_heading         VARCHAR(200) NULL,
  intro_paragraph1      TEXT NULL,
  intro_paragraph2      TEXT NULL,
  stay_info_json        JSON NULL,
  highlight_json        JSON NULL,
  sort_order            INT NOT NULL DEFAULT 0,
  is_featured           TINYINT(1) NOT NULL DEFAULT 0,
  is_published          TINYINT(1) NOT NULL DEFAULT 1,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_slug (slug),
  KEY idx_published (is_published),
  KEY idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. ROOM GALLERY IMAGES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS room_gallery;
CREATE TABLE room_gallery (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id     INT UNSIGNED NOT NULL,
  src         VARCHAR(255) NOT NULL,
  alt         VARCHAR(255) NOT NULL,
  caption     VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  KEY idx_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. ROOM AMENITIES (many-to-many join)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS room_amenities;
CREATE TABLE room_amenities (
  room_id    INT UNSIGNED NOT NULL,
  amenity_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, amenity_id),
  FOREIGN KEY (room_id)    REFERENCES rooms(id)     ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. RELATED ROOMS (self-referential)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS related_rooms;
CREATE TABLE related_rooms (
  room_id      INT UNSIGNED NOT NULL,
  related_id   INT UNSIGNED NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, related_id),
  FOREIGN KEY (room_id)    REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (related_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. GALLERY MEDIA (global gallery page)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS gallery_media;
CREATE TABLE gallery_media (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  category    ENUM('Rooms','Property','Amenities','Dining','Experiences','Local Area') NOT NULL,
  image       VARCHAR(255) NOT NULL,
  alt         VARCHAR(255) NOT NULL,
  description VARCHAR(500) NULL,
  media_type  ENUM('image','video') NOT NULL DEFAULT 'image',
  duration    VARCHAR(30) NULL,
  layout      ENUM('wide','standard','tall') NOT NULL DEFAULT 'standard',
  route       VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_category (category),
  KEY idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. HERO CAROUSEL SLIDES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS hero_slides;
CREATE TABLE hero_slides (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image       VARCHAR(255) NOT NULL,
  alt         VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. TESTIMONIALS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS testimonials;
CREATE TABLE testimonials (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  date_text    VARCHAR(50) NULL,
  rating       TINYINT UNSIGNED NOT NULL DEFAULT 5,
  quote        TEXT NOT NULL,
  avatar       VARCHAR(255) NULL,
  avatar_alt   VARCHAR(255) NULL,
  is_featured  TINYINT(1) NOT NULL DEFAULT 0,
  sort_order   INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_featured (is_featured),
  KEY idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. WINERIES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS wineries;
CREATE TABLE wineries (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  location      VARCHAR(150) NOT NULL,
  drive_minutes INT NOT NULL DEFAULT 0,
  hours         VARCHAR(100) NULL,
  description   VARCHAR(500) NULL,
  image         VARCHAR(255) NOT NULL,
  image_alt     VARCHAR(255) NULL,
  website_url   VARCHAR(255) NULL,
  directions_url VARCHAR(255) NULL,
  categories    JSON NULL,
  is_featured   TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_published (is_published),
  KEY idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. DINING VENUES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS dining_venues;
CREATE TABLE dining_venues (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                      VARCHAR(150) NOT NULL,
  image                     VARCHAR(255) NOT NULL,
  image_alt                 VARCHAR(255) NULL,
  description               VARCHAR(500) NULL,
  type                      ENUM('Cafés','Restaurants','Bars') NOT NULL,
  cuisine                   VARCHAR(100) NULL,
  is_on_site                TINYINT(1) NOT NULL DEFAULT 0,
  distance_meters           INT NOT NULL DEFAULT 0,
  travel_text               VARCHAR(50) NULL,
  price_level               TINYINT NOT NULL DEFAULT 1,
  price_display             VARCHAR(10) NULL,
  hours                     VARCHAR(100) NULL,
  reservations_text         VARCHAR(100) NULL,
  featured                  TINYINT(1) NOT NULL DEFAULT 0,
  directions_url            VARCHAR(255) NULL,
  external_url              VARCHAR(255) NULL,
  contact_phone             VARCHAR(50) NULL,
  address                   VARCHAR(255) NULL,
  sort_order                INT NOT NULL DEFAULT 0,
  is_published              TINYINT(1) NOT NULL DEFAULT 1,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_type (type),
  KEY idx_published (is_published),
  KEY idx_onsite (is_on_site)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. ACTIVITIES (Things to Do)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS activities;
CREATE TABLE activities (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(150) NOT NULL,
  image              VARCHAR(255) NOT NULL,
  image_alt          VARCHAR(255) NULL,
  description        VARCHAR(500) NULL,
  location           VARCHAR(150) NULL,
  drive_minutes      INT NOT NULL DEFAULT 0,
  distance_meters    INT NOT NULL DEFAULT 0,
  duration           VARCHAR(50) NULL,
  audience           VARCHAR(80) NULL,
  price_level        TINYINT NOT NULL DEFAULT 0,
  price_display      VARCHAR(20) NULL,
  seasonality        VARCHAR(100) NULL,
  categories         JSON NULL,
  booking_required   TINYINT(1) NOT NULL DEFAULT 0,
  featured           TINYINT(1) NOT NULL DEFAULT 0,
  directions_url     VARCHAR(255) NULL,
  sort_order         INT NOT NULL DEFAULT 0,
  is_published       TINYINT(1) NOT NULL DEFAULT 1,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_published (is_published),
  KEY idx_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. CONTACT INQUIRIES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS contact_inquiries;
CREATE TABLE contact_inquiries (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  phone       VARCHAR(50) NULL,
  subject     VARCHAR(200) NULL,
  message     TEXT NOT NULL,
  status      ENUM('new','read','replied','archived') NOT NULL DEFAULT 'new',
  is_spam     TINYINT(1) NOT NULL DEFAULT 0,
  reply_sent  TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. NEWSLETTER SUBSCRIBERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS newsletter_subscribers;
CREATE TABLE newsletter_subscribers (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 16. FAQ ITEMS (Contact / About page)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS faq_items;
CREATE TABLE faq_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question    VARCHAR(300) NOT NULL,
  answer      TEXT NOT NULL,
  category    VARCHAR(80) NOT NULL DEFAULT 'General',
  sort_order  INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_category (category),
  KEY idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 17. PAGE CONTENTS - flexible JSON blocks for hero/CTA/intro content
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS page_contents;
CREATE TABLE page_contents (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_key    VARCHAR(80) NOT NULL UNIQUE,
  page_name   VARCHAR(100) NOT NULL,
  data_json   JSON NOT NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_page_key (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- End of schema
-- =====================================================================
