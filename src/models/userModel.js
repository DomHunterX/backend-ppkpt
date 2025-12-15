const { db } = require('../config/database');

// Fungsi untuk mencari user berdasarkan NPM atau Username (Untuk Login)
const findUserByIdentity = async (identityOrUsername) => {
    const query = `
        SELECT * FROM users 
        WHERE identity_number = ? OR username = ? 
        LIMIT 1
    `;
    
    const [rows] = await db.execute(query, [identityOrUsername, identityOrUsername]);
    
    return rows[0];
};

// Fungsi untuk mendaftarkan user baru (dengan username opsional)
// Catatan: Tabel `users` memiliki: id, identity_number, username, password, role, created_at
// Jika butuh menyimpan nama/no HP, gunakan tabel role-specific (`mahasiswa`, `admin`, `super_admin`).
const createNewUser = async (data) => {
    const { identity_number, username, password, role } = data;

    const query = `
        INSERT INTO users (identity_number, username, password, role)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        identity_number,
        username || null, // Username opsional
        password,
        role || 'mahasiswa' // Default role
    ]);

    return result; // Mengembalikan info insert
};

// Fungsi untuk generate NPM mahasiswa otomatis
const generateNPM = async (tahun_masuk, kode_jurusan) => {
    // Format: [2 digit tahun][4 digit kode jurusan][2 digit urutan]
    // Contoh: 23759001, 24783101
    
    // Ambil 2 digit terakhir tahun (2023 -> 23, 2024 -> 24)
    const tahunPrefix = String(tahun_masuk).slice(-2);
    const prefix = `${tahunPrefix}${kode_jurusan}`; // Contoh: 237590, 247831
    
    // Cari NPM terakhir dengan prefix yang sama
    const query = `
        SELECT identity_number 
        FROM users 
        WHERE identity_number LIKE ? 
        ORDER BY identity_number DESC 
        LIMIT 1
    `;
    
    const [rows] = await db.execute(query, [`${prefix}%`]);
    
    let nextNumber = 1; // Default jika belum ada mahasiswa dengan prefix ini
    
    if (rows.length > 0) {
        // Ambil 2 digit terakhir dan increment
        const lastNPM = rows[0].identity_number;
        const lastNumber = parseInt(lastNPM.slice(-2)); // Ambil 2 digit terakhir
        nextNumber = lastNumber + 1;
    }
    
    // Format 2 digit dengan leading zero (01, 02, ..., 99)
    const urutan = String(nextNumber).padStart(2, '0');
    
    return `${prefix}${urutan}`;
};

module.exports = {
    findUserByIdentity,
    createNewUser,
    generateNPM
};