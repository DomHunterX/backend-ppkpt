// Script untuk migrasi tabel notifications
// Jalankan: node src/scripts/migrate_notifications.js

require('dotenv').config();
const { db } = require('../config/database');

const migrateNotifications = async () => {
    try {
        console.log('🔄 Memulai migrasi tabel notifications...');

        // 1. Tambah kolom user_id
        console.log('📝 Menambah kolom user_id...');
        await db.execute(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS user_id INT(11) DEFAULT NULL AFTER ref_type
        `);

        // 2. Tambah kolom is_read
        console.log('📝 Menambah kolom is_read...');
        await db.execute(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS is_read TINYINT(1) DEFAULT 0 AFTER user_id
        `);

        // 3. Tambah kolom read_at
        console.log('📝 Menambah kolom read_at...');
        await db.execute(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL DEFAULT NULL AFTER is_read
        `);

        // 4. Tambah indexes
        console.log('📝 Menambah indexes...');
        
        try {
            await db.execute(`ALTER TABLE notifications ADD INDEX idx_user_id (user_id)`);
            console.log('✅ Index idx_user_id ditambahkan');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index idx_user_id sudah ada');
            } else {
                throw err;
            }
        }

        try {
            await db.execute(`ALTER TABLE notifications ADD INDEX idx_is_read (is_read)`);
            console.log('✅ Index idx_is_read ditambahkan');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index idx_is_read sudah ada');
            } else {
                throw err;
            }
        }

        try {
            await db.execute(`ALTER TABLE notifications ADD INDEX idx_user_created (user_id, created_at)`);
            console.log('✅ Index idx_user_created ditambahkan');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index idx_user_created sudah ada');
            } else {
                throw err;
            }
        }

        try {
            await db.execute(`ALTER TABLE notifications ADD INDEX idx_user_unread (user_id, is_read, created_at)`);
            console.log('✅ Index idx_user_unread ditambahkan');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index idx_user_unread sudah ada');
            } else {
                throw err;
            }
        }

        // Verification
        console.log('\n📊 Verifikasi struktur tabel notifications:');
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'notifications'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.table(columns);

        console.log('\n✅ Migrasi selesai!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error saat migrasi:', error);
        process.exit(1);
    }
};

migrateNotifications();
