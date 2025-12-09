const mysql = require('mysql2');
require('dotenv').config(); // Load variabel dari .env

// Membuat Pool Koneksi
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Maksimal 10 koneksi simultan
    queueLimit: 0
});

// Cek koneksi saat server start
const checkConnection = () => {
    return new Promise((resolve, reject) => {
        dbPool.getConnection((err, connection) => {
            if (err) {
                console.error('Database Connection Failed:', err.message);
                reject(err);
            } else {
                console.log('Database Connected Successfully');
                connection.release(); // Kembalikan koneksi ke pool
                resolve();
            }
        });
    });
};

// Export promise-based pool agar bisa menggunakan async/await
module.exports = {
    db: dbPool.promise(),
    checkConnection
};