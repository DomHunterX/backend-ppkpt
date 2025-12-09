const express = require('express');
const app = express();
require('dotenv').config();
const authRoutes = require('./src/routes/authRoutes'); // Route API untuk login, Register

// Import fungsi cek koneksi
const { checkConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/auth', authRoutes); // Panggil Route API

// Route Utama
app.get('/', (req, res) => {
    res.send('Halo! Selamat datang di Server Express PPKPT');
});

// Start Server dengan pengecekan DB
const startServer = async () => {
    try {
        await checkConnection(); // Cek DB dulu
        app.listen(PORT, () => {
            console.log(`Server PPKPT berjalan di port ${PORT}`);
        });
    } catch (error) {
        console.error("Gagal menjalankan server karena koneksi DB error.");
        process.exit(1); // Stop aplikasi jika DB mati
    }
};

startServer();