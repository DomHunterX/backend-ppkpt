const bcrypt = require('bcryptjs');
require('dotenv').config();
const { db } = require('../config/database');

// Data mahasiswa yang akan di-seed
const mahasiswaData = [
  {
    identity_number: 'MHS0001',
    password: 'test1234',
    full_name: 'Mahasiswa Test 1',
    jurusan: 'Teknik Informatika',
    phone_number: '081234567890'
  },
  {
    identity_number: 'MHS0002',
    password: 'test1234',
    full_name: 'Mahasiswa Test 2',
    jurusan: 'Manajemen Informatika',
    phone_number: '081234567891'
  }
];

async function seedUser(data) {
  const { identity_number, password, full_name, jurusan, phone_number } = data;
  const role = 'mahasiswa';

  const hashed = await bcrypt.hash(password, 10);

  // Cek apakah user sudah ada
  const [existsRows] = await db.execute(
    'SELECT id FROM users WHERE identity_number = ? LIMIT 1',
    [identity_number]
  );
  
  let userId;
  if (existsRows.length) {
    userId = existsRows[0].id;
    console.log(`✅ User ${identity_number} sudah ada (ID: ${userId})`);
  } else {
    // Insert into users
    const [res] = await db.execute(
      'INSERT INTO users (identity_number, password, role) VALUES (?, ?, ?)',
      [identity_number, hashed, role]
    );
    userId = res.insertId;
    console.log(`✅ User ${identity_number} berhasil dibuat (ID: ${userId})`);
  }

  // Insert mahasiswa profile
  const [mhsExists] = await db.execute(
    'SELECT id FROM mahasiswa WHERE nim = ? LIMIT 1',
    [identity_number]
  );
  
  if (mhsExists.length) {
    console.log(`   → Profil mahasiswa ${identity_number} sudah ada`);
  } else {
    const [resMhs] = await db.execute(
      'INSERT INTO mahasiswa (user_id, nim, full_name, jurusan, phone_number) VALUES (?, ?, ?, ?, ?)',
      [userId, identity_number, full_name, jurusan, phone_number]
    );
    console.log(`   → Profil mahasiswa ${identity_number} berhasil dibuat (ID: ${resMhs.insertId})`);
  }

  console.log(`   → Login: ${identity_number} / ${password}\n`);
}

async function run() {
  try {
    console.log('🌱 Mulai seeding mahasiswa test...\n');

    for (const mhs of mahasiswaData) {
      await seedUser(mhs);
    }

    console.log('✅ Seeding selesai!');
    console.log('\n📋 Akun test yang tersedia:');
    mahasiswaData.forEach(mhs => {
      console.log(`   - ${mhs.identity_number} / ${mhs.password} (${mhs.full_name})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

run();
