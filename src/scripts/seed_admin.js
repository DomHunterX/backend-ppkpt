const bcrypt = require('bcryptjs');
require('dotenv').config();
const { db } = require('../config/database');

async function run() {
  try {
    // Admin 1
    const admin1 = {
      identity_number: 'ADM0001',
      username: 'admin1',
      password: 'test1234',
      full_name: 'Admin Satgas 1',
      phone_number: '081234567891',
      role: 'admin'
    };

    // Admin 2
    const admin2 = {
      identity_number: 'ADM0002',
      username: 'admin2',
      password: 'test1234',
      full_name: 'Admin Satgas 2',
      phone_number: '081234567892',
      role: 'admin'
    };

    for (const admin of [admin1, admin2]) {
      // Hash password
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      console.log(`\n🔐 Processing: ${admin.username}`);
      console.log(`Password hash: ${hashedPassword}`);

      // Cek apakah user sudah ada
      const [existsRows] = await db.execute(
        'SELECT id FROM users WHERE identity_number = ? LIMIT 1',
        [admin.identity_number]
      );

      let userId;
      if (existsRows.length) {
        // Update password jika sudah ada
        userId = existsRows[0].id;
        await db.execute(
          'UPDATE users SET password = ?, username = ? WHERE id = ?',
          [hashedPassword, admin.username, userId]
        );
        console.log(`✅ Updated user id: ${userId}`);
      } else {
        // Insert user baru
        const [res] = await db.execute(
          'INSERT INTO users (identity_number, username, password, role) VALUES (?, ?, ?, ?)',
          [admin.identity_number, admin.username, hashedPassword, admin.role]
        );
        userId = res.insertId;
        console.log(`✅ Inserted user id: ${userId}`);
      }

      console.log(`Identity: ${admin.identity_number}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Password (plain): ${admin.password}`);

      // Insert admin profile
      const [adminExists] = await db.execute(
        'SELECT id FROM admin WHERE user_id = ? LIMIT 1',
        [userId]
      );

      if (adminExists.length) {
        console.log(`✅ Admin profile already exists with id: ${adminExists[0].id}`);
      } else {
        const [resAdmin] = await db.execute(
          'INSERT INTO admin (user_id, full_name, phone_number) VALUES (?, ?, ?)',
          [userId, admin.full_name, admin.phone_number]
        );
        console.log(`✅ Inserted admin profile id: ${resAdmin.insertId}`);
      }
    }

    console.log('\n🎉 Selesai! Admin berhasil dibuat/diupdate.');
    console.log('\nLogin credentials:');
    console.log('- Username: admin1 | Password: test1234');
    console.log('- Username: admin2 | Password: test1234');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

run();
