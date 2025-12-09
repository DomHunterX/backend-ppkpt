const { db } = require('../config/database');

// Fungsi untuk mencari user berdasarkan NPM (Untuk Login)
const findUserByIdentity = async (identityNumber) => {
    const query = `SELECT * FROM users WHERE identity_number = ? LIMIT 1`;
    
    const [rows] = await db.execute(query, [identityNumber]);
    
    return rows[0];
};

// Fungsi untuk mendaftarkan user baru
const createNewUser = async (data) => {
    const { identity_number, full_name, password, role, phone_number } = data;
    
    const query = `
        INSERT INTO users (identity_number, full_name, password, role, phone_number)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
        identity_number, 
        full_name, 
        password, 
        role || 'mahasiswa', // Default role
        phone_number
    ]);
    
    return result; // Mengembalikan info insert
};

module.exports = {
    findUserByIdentity,
    createNewUser
};