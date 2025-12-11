const express = require('express');
const http = require('http'); // [BARU] Import module HTTP bawaan
const { Server } = require("socket.io"); // [BARU] Import library Socket.io

const app = express();
require('dotenv').config();

// [BARU] Inisialisasi HTTP Server & Socket.io
const server = http.createServer(app); // Bungkus app express
const io = new Server(server, {
    cors: {
        origin: "*", // Izinkan koneksi dari semua IP (Penting untuk Flutter/Mobile)
        methods: ["GET", "POST"]
    }
});

// Import Route
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const laporanRoutes = require('./src/routes/laporanRoutes');

// Import fungsi cek koneksi
const { checkConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Middleware JSON
app.use(express.json());

// [BARU] Logic WebSocket
io.on('connection', (socket) => {
    console.log('Client terkoneksi ke WebSocket:', socket.id);

    // Event: User join room berdasarkan ID-nya (untuk notif privat)
    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ID ${userId} bergabung ke room notifikasi.`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnect:', socket.id);
    });
});

// [BARU] Simpan instance 'io' agar bisa dipanggil di Controller (laporan/profile)
app.set('socketio', io);

// Setup Routes API
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', laporanRoutes);

// Route Utama
app.get('/', (req, res) => {
    res.send('Halo! Selamat datang di Server Express PPKPT (WebSocket Ready)');
});

// Start Server dengan pengecekan DB
const startServer = async () => {
    try {
        await checkConnection(); // Cek DB dulu
        
        // [PENTING] GANTI app.listen MENJADI server.listen
        server.listen(PORT, () => {
            console.log(`🚀 Server PPKPT berjalan dengan WebSocket di port ${PORT}`);
        });
        
    } catch (error) {
        console.error("❌ Gagal menjalankan server karena koneksi DB error.");
        console.error(error);
        process.exit(1); // Stop aplikasi jika DB mati
    }
};

startServer();