const laporanModel = require('../models/laporanModel');
const { db } = require('../config/database');

// POST /api/laporan - Buat laporan baru
const createLaporan = async (req, res) => {
    try {
        // Ambil mahasiswa_id dari tabel mahasiswa berdasarkan user_id yang login
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

        // Siapkan data laporan (semua field opsional kecuali mahasiswa_id dan tanggal default)
        const laporanData = {
            mahasiswa_id,
            nama: req.body.nama,
            nomor_telepon: req.body.nomor_telepon,
            domisili: req.body.domisili,
            tanggal: req.body.tanggal || new Date().toISOString().split('T')[0], // Default tanggal hari ini jika kosong
            jenis_kekerasan: req.body.jenis_kekerasan,
            cerita_peristiwa: req.body.cerita_peristiwa,
            pelampiran_bukti: req.body.pelampiran_bukti,
            disabilitas: req.body.disabilitas,
            status_pelapor: req.body.status_pelapor,
            alasan: req.body.alasan,
            alasan_lainnya: req.body.alasan_lainnya,
            pendampingan: req.body.pendampingan
        };

        // Simpan laporan
        const result = await laporanModel.createLaporan(laporanData);

        res.status(201).json({
            message: "Laporan berhasil dibuat",
            laporan_id: result.insertId
        });

    } catch (error) {
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

module.exports = {
    createLaporan,
    getMyLaporan
};
