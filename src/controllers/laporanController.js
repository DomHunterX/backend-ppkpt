const laporanModel = require('../models/laporanModel');
const { db } = require('../config/database');

// POST /api/laporan - Buat laporan baru
const createLaporan = async (req, res) => {
    try {
        // 1. Ambil mahasiswa_id dari tabel mahasiswa berdasarkan user_id yang login
        const userId = req.user.id; // dari middleware auth
        const [mahasiswaRows] = await db.execute(
            'SELECT id FROM mahasiswa WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (!mahasiswaRows.length) {
            return res.status(404).json({ 
                message: "Data mahasiswa tidak ditemukan. Pastikan profil mahasiswa sudah dibuat." 
            });
        }

        const mahasiswa_id = mahasiswaRows[0].id;

        // 2. Cek apakah ada file bukti yang diupload (jika pakai Multer)
        const buktiFile = req.file ? req.file.filename : req.body.pelampiran_bukti;

        // 3. Siapkan data laporan
        const laporanData = {
            mahasiswa_id,
            nama: req.body.nama,
            nomor_telepon: req.body.nomor_telepon,
            domisili: req.body.domisili,
            tanggal: req.body.tanggal || new Date().toISOString().split('T')[0],
            jenis_kekerasan: req.body.jenis_kekerasan,
            cerita_peristiwa: req.body.cerita_peristiwa,
            pelampiran_bukti: buktiFile, // Gunakan nama file dari Multer/Body
            disabilitas: req.body.disabilitas,
            status_pelapor: req.body.status_pelapor,
            alasan: req.body.alasan,
            alasan_lainnya: req.body.alasan_lainnya,
            pendampingan: req.body.pendampingan
        };

        // 4. Simpan laporan
        const result = await laporanModel.createLaporan(laporanData);

        res.status(201).json({
            message: "Laporan berhasil dibuat",
            laporan_id: result.insertId
        });

    } catch (error) {
        console.error("Error createLaporan:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// GET /api/laporan/me - Ambil laporan milik user yang login
const getMyLaporan = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Cari mahasiswa_id
        const [mahasiswaRows] = await db.execute(
            'SELECT id FROM mahasiswa WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (!mahasiswaRows.length) {
            return res.status(404).json({ 
                message: "Data mahasiswa tidak ditemukan." 
            });
        }

        const mahasiswa_id = mahasiswaRows[0].id;
        const laporan = await laporanModel.getLaporanByMahasiswaId(mahasiswa_id);

        res.json({
            message: "Berhasil mengambil data laporan",
            data: laporan
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// PUT /api/laporan/:id/status - Update Status Laporan (Untuk Satgas) & Kirim Notif
const updateStatusLaporan = async (req, res) => {
    const { id } = req.params; // ID Laporan
    const { status, catatan } = req.body; // Status baru & Catatan (opsional)

    try {
        // 1. Update Database (Status & Catatan)
        // Pastikan kolom 'catatan' atau 'alasan_status' ada di tabel Anda
        const queryUpdate = `UPDATE laporan SET status = ?, alasan_lainnya = ? WHERE id = ?`; 
        // *Catatan: Saya pakai 'alasan_lainnya' untuk menyimpan catatan admin, sesuaikan dengan kolom DB Anda jika ada kolom khusus misal 'admin_notes'*
        
        await db.execute(queryUpdate, [status, catatan, id]);

        // 2. Ambil Data User untuk Notifikasi
        // Kita perlu tahu siapa pemilik laporan ini (user_id) untuk kirim WebSocket ke room yang benar
        const queryUser = `
            SELECT m.user_id, l.jenis_kekerasan, l.nama 
            FROM laporan l 
            JOIN mahasiswa m ON l.mahasiswa_id = m.id 
            WHERE l.id = ?
        `;
        const [rows] = await db.execute(queryUser, [id]);

        if (rows.length > 0) {
            const targetUserId = rows[0].user_id;
            const jenisKasus = rows[0].jenis_kekerasan;

            // 3. 🔥 INTEGRASI WEBSOCKET 🔥
            const io = req.app.get('socketio');

            // Kirim pesan real-time ke User tersebut
            io.to(targetUserId).emit("notifikasi_status", {
                laporan_id: id,
                title: "Status Laporan Diperbarui",
                message: `Laporan ${jenisKasus} Anda kini berstatus: ${status}`,
                status_baru: status,
                timestamp: new Date()
            });

            console.log(`🔔 Notifikasi WebSocket dikirim ke User ID: ${targetUserId}`);
        }

        res.json({ 
            message: "Status berhasil diupdate dan notifikasi dikirim ke pelapor." 
        });

    } catch (error) {
        console.error("Error updateStatus:", error);
        res.status(500).json({ message: "Gagal update status laporan" });
    }
};

module.exports = {
    createLaporan,
    getMyLaporan,
    updateStatusLaporan // Jangan lupa diexport
};