// Script untuk migrasi database production
// Jalankan: node src/scripts/migrate_production.js

require('dotenv').config();
const { db } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const migrateProduction = async () => {
    try {
        console.log('\n🚨 ========================================');
        console.log('   DATABASE MIGRATION TO PRODUCTION');
        console.log('========================================== 🚨\n');
        
        console.log('⚠️  WARNING: This will modify your database structure!\n');
        console.log('Changes to be applied:');
        console.log('1. Add columns to "users" table: username, is_active');
        console.log('2. Add columns to "notifications" table: user_id, is_read, read_at');
        console.log('3. Add indexes for optimization\n');
        
        const answer = await question('❓ Have you BACKED UP your database? (yes/no): ');
        
        if (answer.toLowerCase() !== 'yes') {
            console.log('\n❌ Migration cancelled. Please backup your database first!');
            console.log('Backup command: mysqldump -u root -p db_ppkpt_polinela > backup.sql\n');
            process.exit(0);
        }
        
        const confirm = await question('❓ Proceed with migration? (yes/no): ');
        
        if (confirm.toLowerCase() !== 'yes') {
            console.log('\n❌ Migration cancelled by user.\n');
            process.exit(0);
        }
        
        console.log('\n🔄 Starting migration...\n');
        
        // ============================================
        // 1. UPDATE TABEL USERS
        // ============================================
        
        console.log('📝 Updating "users" table...');
        
        try {
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN username VARCHAR(50) NULL AFTER identity_number
            `);
            console.log('✅ Column "username" added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column "username" already exists');
            } else {
                throw err;
            }
        }
        
        try {
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role
            `);
            console.log('✅ Column "is_active" added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column "is_active" already exists');
            } else {
                throw err;
            }
        }
        
        try {
            await db.execute(`ALTER TABLE users ADD UNIQUE INDEX idx_username (username)`);
            console.log('✅ Index "idx_username" added');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index "idx_username" already exists');
            } else {
                throw err;
            }
        }
        
        // ============================================
        // 2. UPDATE TABEL NOTIFICATIONS
        // ============================================
        
        console.log('\n📝 Updating "notifications" table...');
        
        try {
            await db.execute(`
                ALTER TABLE notifications 
                ADD COLUMN user_id INT(11) DEFAULT NULL AFTER ref_type
            `);
            console.log('✅ Column "user_id" added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column "user_id" already exists');
            } else {
                throw err;
            }
        }
        
        try {
            await db.execute(`
                ALTER TABLE notifications 
                ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER user_id
            `);
            console.log('✅ Column "is_read" added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column "is_read" already exists');
            } else {
                throw err;
            }
        }
        
        try {
            await db.execute(`
                ALTER TABLE notifications 
                ADD COLUMN read_at TIMESTAMP NULL DEFAULT NULL AFTER is_read
            `);
            console.log('✅ Column "read_at" added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column "read_at" already exists');
            } else {
                throw err;
            }
        }
        
        // Add indexes
        const indexes = [
            { name: 'idx_user_id', sql: 'ALTER TABLE notifications ADD INDEX idx_user_id (user_id)' },
            { name: 'idx_is_read', sql: 'ALTER TABLE notifications ADD INDEX idx_is_read (is_read)' },
            { name: 'idx_user_created', sql: 'ALTER TABLE notifications ADD INDEX idx_user_created (user_id, created_at)' },
            { name: 'idx_user_unread', sql: 'ALTER TABLE notifications ADD INDEX idx_user_unread (user_id, is_read, created_at)' }
        ];
        
        for (const index of indexes) {
            try {
                await db.execute(index.sql);
                console.log(`✅ Index "${index.name}" added`);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`⚠️  Index "${index.name}" already exists`);
                } else {
                    throw err;
                }
            }
        }
        
        // ============================================
        // 3. UPDATE EXISTING DATA
        // ============================================
        
        console.log('\n📝 Updating existing data...');
        
        await db.execute(`UPDATE users SET is_active = 1 WHERE is_active IS NULL`);
        console.log('✅ Set all existing users to active');
        
        await db.execute(`UPDATE notifications SET is_read = 0 WHERE is_read IS NULL`);
        console.log('✅ Set all existing notifications to unread');
        
        // ============================================
        // 4. VERIFICATION
        // ============================================
        
        console.log('\n📊 Verifying migration...\n');
        
        const [usersColumns] = await db.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);
        
        const [notifColumns] = await db.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'notifications'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('📋 Users table structure:');
        console.table(usersColumns);
        
        console.log('\n📋 Notifications table structure:');
        console.table(notifColumns);
        
        // Summary
        const [summary] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
                (SELECT COUNT(*) FROM notifications) as total_notifications,
                (SELECT COUNT(*) FROM notifications WHERE is_read = 0) as unread_notifications
        `);
        
        console.log('\n📊 Summary:');
        console.table(summary);
        
        console.log('\n✅ ========================================');
        console.log('   MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================================== ✅\n');
        
        console.log('🎉 Your database is now up to date!');
        console.log('🚀 You can now deploy the new backend version.\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ========================================');
        console.error('   MIGRATION FAILED!');
        console.error('========================================== ❌\n');
        console.error('Error:', error.message);
        console.error('\n⚠️  Please check the error and try again.');
        console.error('⚠️  If needed, restore from backup:\n');
        console.error('   mysql -u root -p db_ppkpt_polinela < backup.sql\n');
        process.exit(1);
    } finally {
        rl.close();
    }
};

migrateProduction();
