const bcrypt = require('bcryptjs');
require('dotenv').config();
const { db } = require('../config/database');

async function run() {
  try {
    const identity_number = 'MHS0003';
    const rawPassword = 'test1234';
    const role = 'mahasiswa';
    const full_name = 'Mahasiswa Test 3';
    const jurusan = 'Teknik Informatika';
    const phone_number = '081234567893';

    const hashed = await bcrypt.hash(rawPassword, 10);

    // Cek apakah user sudah ada
    const [existsRows] = await db.execute(
      'SELECT id FROM users WHERE identity_number = ? LIMIT 1',
      [identity_number]
    );
    let userId;
    if (existsRows.length) {
      userId = existsRows[0].id;
      console.log('User already exists with id:', userId);
    } else {
      // Insert into users
      const [res] = await db.execute(
        'INSERT INTO users (identity_number, password, role) VALUES (?, ?, ?)',
        [identity_number, hashed, role]
      );
      userId = res.insertId;
      console.log('Inserted user id:', userId);
    }

    console.log('identity_number:', identity_number);
    console.log('password (plain for test):', rawPassword);

    // Insert mahasiswa profile
    const [mhsExists] = await db.execute(
      'SELECT id FROM mahasiswa WHERE nim = ? LIMIT 1',
      [identity_number]
    );
    if (mhsExists.length) {
      console.log('Mahasiswa profile already exists with id:', mhsExists[0].id);
    } else {
      const [resMhs] = await db.execute(
        'INSERT INTO mahasiswa (user_id, nim, full_name, jurusan, phone_number) VALUES (?, ?, ?, ?, ?)',
        [userId, identity_number, full_name, jurusan, phone_number]
      );
      console.log('Inserted mahasiswa id:', resMhs.insertId);
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

run();
