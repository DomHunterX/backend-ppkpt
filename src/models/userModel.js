const { db } = require('../config/database');

// Fungsi untuk mencari user berdasarkan NPM (Untuk Login)
const findUserByIdentity = async (identityNumber) => {
    const query = `SELECT * FROM users WHERE identity_number = ? LIMIT 1`;
    
    const [rows] = await db.execute(query, [identityNumber]);
    
    return rows[0];
};

// Fungsi untuk mendaftarkan user baru (sesuai tabel `users` di DB dump)
// Catatan: Tabel `users` hanya memiliki: id, identity_number, password, role, created_at
// Jika butuh menyimpan nama/no HP, gunakan tabel role-specific (`mahasiswa`, `admin`, `super_admin`).
const createNewUser = async (data) => {
    const { identity_number, password, role } = data;

    const query = `
        INSERT INTO users (identity_number, password, role)
        VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        identity_number,
        password,
        role || 'mahasiswa' // Default role
    ]);

    return result; // Mengembalikan info insert
};

module.exports = {
    findUserByIdentity,
    createNewUser
};