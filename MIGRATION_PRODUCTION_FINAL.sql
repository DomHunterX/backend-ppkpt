-- =====================================================
-- MIGRATION SCRIPT UNTUK PRODUCTION SERVER
-- Dibuat: 16 Desember 2025
-- =====================================================
-- Jalankan di production database yang sudah ada
-- Script ini aman untuk database yang sudah memiliki data
-- =====================================================

USE db_ppkpt_polinela;

-- =====================================================
-- 1. UPDATE TABLE USERS
-- =====================================================

-- Tambah kolom username (jika belum ada)
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `username` VARCHAR(50) UNIQUE DEFAULT NULL AFTER `identity_number`;

-- Tambah kolom is_active (jika belum ada)
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1 AFTER `role`;

-- Tambah index untuk username
ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_username` (`username`);

-- =====================================================
-- 2. UPDATE TABLE NOTIFICATIONS
-- =====================================================

-- Tambah kolom user_id (jika belum ada)
ALTER TABLE `notifications` 
ADD COLUMN IF NOT EXISTS `user_id` INT(11) DEFAULT NULL AFTER `ref_type`;

-- Tambah kolom is_read (jika belum ada)
ALTER TABLE `notifications` 
ADD COLUMN IF NOT EXISTS `is_read` TINYINT(1) DEFAULT 0 AFTER `user_id`;

-- Tambah kolom read_at (jika belum ada)
ALTER TABLE `notifications` 
ADD COLUMN IF NOT EXISTS `read_at` TIMESTAMP NULL DEFAULT NULL AFTER `is_read`;

-- Tambah indexes untuk notifications
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
              WHERE table_schema = DATABASE() 
              AND table_name = 'notifications' 
              AND index_name = 'idx_user_id');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE notifications ADD INDEX idx_user_id (user_id)', 
                   'SELECT "Index idx_user_id already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
              WHERE table_schema = DATABASE() 
              AND table_name = 'notifications' 
              AND index_name = 'idx_is_read');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE notifications ADD INDEX idx_is_read (is_read)', 
                   'SELECT "Index idx_is_read already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
              WHERE table_schema = DATABASE() 
              AND table_name = 'notifications' 
              AND index_name = 'idx_user_created');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE notifications ADD INDEX idx_user_created (user_id, created_at)', 
                   'SELECT "Index idx_user_created already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
              WHERE table_schema = DATABASE() 
              AND table_name = 'notifications' 
              AND index_name = 'idx_user_unread');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE notifications ADD INDEX idx_user_unread (user_id, is_read, created_at)', 
                   'SELECT "Index idx_user_unread already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

SELECT '✅ Migration completed successfully!' as status;

-- Cek struktur table users
SELECT 'TABLE USERS:' as info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Cek struktur table notifications
SELECT 'TABLE NOTIFICATIONS:' as info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'notifications'
ORDER BY ORDINAL_POSITION;

-- Cek indexes
SELECT 'INDEXES:' as info;
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('users', 'notifications')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
