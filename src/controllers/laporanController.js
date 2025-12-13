const laporanModel = require('../models/laporanModel');
const notificationModel = require('../models/notificationModel');
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

        // 2. CEK PEMBATASAN: Cek apakah sudah ada laporan aktif (belum Selesai/Ditolak)
        const [activeLaporan] = await db.execute(
            `SELECT laporan_id, status FROM laporan 
             WHERE mahasiswa_id = ? 
             AND status NOT IN ('Selesai', 'Ditolak')
             LIMIT 1`,
            [mahasiswa_id]
        );

        if (activeLaporan.length > 0) {
            return res.status(400).json({ 
                message: "Anda masih memiliki laporan yang sedang diproses. Harap tunggu hingga laporan selesai atau ditolak sebelum membuat laporan baru.",
                laporan_aktif: {
                    laporan_id: activeLaporan[0].laporan_id,
                    status: activeLaporan[0].status
                }
            });
        }

        // 3. Cek apakah ada file bukti yang diupload (jika pakai Multer)
        const buktiFile = req.file ? req.file.filename : req.body.pelampiran_bukti;

        // 4. Siapkan data laporan
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

        // 5. Simpan laporan
        const result = await laporanModel.createLaporan(laporanData);

        const kodeLaporan = `LP-${String(result.insertId).padStart(6, '0')}KV`;
        const notifTitle = "Laporan Dalam Diproses";
        const notifMessage = "Laporan telah diterima dan menunggu verifikasi";

        // 6. Simpan notifikasi ke database
        await notificationModel.createNotification({
            type: 'LAPORAN_BARU',
            title: notifTitle,
            message: `${notifMessage}. Kode: ${kodeLaporan}`,
            ref_id: result.insertId,
            ref_type: 'LAPORAN'
        });

        console.log(`💾 Notifikasi tersimpan di database untuk Laporan ID: ${result.insertId}`);

        // 7. Kirim notifikasi real-time via WebSocket
        const io = req.app.get('socketio');
        
        // 7a. Notifikasi ke MAHASISWA yang buat laporan (private)
        io.to(String(userId)).emit("notifikasi_laporan", {
            laporan_id: result.insertId,
            kode_laporan: kodeLaporan,
            title: notifTitle,
            message: notifMessage,
            status: "Dalam Proses",
            jenis_kekerasan: req.body.jenis_kekerasan,
            timestamp: new Date()
        });

        console.log(`🔔 Notifikasi real-time dikirim ke Mahasiswa (User ID: ${userId})`);

        // 7b. Broadcast ke SEMUA ADMIN & SUPER ADMIN (group notification)
        io.to('admin_room').emit("notifikasi_laporan_admin", {
            laporan_id: result.insertId,
            kode_laporan: kodeLaporan,
            title: "Laporan Baru Masuk",
            message: `Laporan ${req.body.jenis_kekerasan} dari ${req.body.nama} telah masuk dan menunggu ditinjau`,
            status: "Dalam Proses",
            jenis_kekerasan: req.body.jenis_kekerasan,
            pelapor: req.body.nama,
            timestamp: new Date()
        });

        console.log(`📢 Broadcast notifikasi ke semua Admin & Super Admin`);

        res.status(201).json({
            message: "Laporan berhasil dibuat",
            laporan_id: result.insertId,
            kode_laporan: kodeLaporan
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

        // Mapping bulan Inggris ke Indonesia
        const bulanMap = {
            'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
            'May': 'Mei', 'Jun': 'Juni', 'Jul': 'Juli', 'Aug': 'Agu',
            'Sep': 'Sep', 'Oct': 'Okt', 'Nov': 'Nov', 'Dec': 'Des'
        };

        // Format response untuk card Flutter
        const formattedLaporan = laporan.map(item => {
            // Convert bulan ke Indonesia
            let tanggalID = item.tanggal_format;
            if (tanggalID) {
                Object.keys(bulanMap).forEach(key => {
                    tanggalID = tanggalID.replace(key, bulanMap[key]);
                });
            }

            return {
                laporan_id: item.laporan_id,
                kode_laporan: `LP-${String(item.laporan_id).padStart(6, '0')}KV`,
                jenis_kekerasan: item.jenis_kekerasan,
                status: item.status,
                jam: item.jam_dibuat,           // Format: "17:45"
                tanggal: tanggalID,             // Format: "24 Juni"
                nama: item.nama,
                domisili: item.domisili
            };
        });

        res.json({
            message: "Berhasil mengambil data laporan",
            data: formattedLaporan
        });

    } catch (error) {
        console.error("Error getMyLaporan:", error);
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
        const queryUpdate = `UPDATE laporan SET status = ?, alasan_lainnya = ? WHERE laporan_id = ?`; 
        
        await db.execute(queryUpdate, [status, catatan, id]);

        // 2. Ambil Data User untuk Notifikasi
        const queryUser = `
            SELECT m.user_id, l.jenis_kekerasan, l.nama 
            FROM laporan l 
            JOIN mahasiswa m ON l.mahasiswa_id = m.id 
            WHERE l.laporan_id = ?
        `;
        const [rows] = await db.execute(queryUser, [id]);

        if (rows.length > 0) {
            const targetUserId = rows[0].user_id;
            const jenisKasus = rows[0].jenis_kekerasan;

            const kodeLaporan = `LP-${String(id).padStart(6, '0')}KV`;
            const notifTitle = "Status Laporan Diperbarui";
            const notifMessage = `Laporan ${jenisKasus} Anda kini berstatus: ${status}`;

            // 3. Simpan notifikasi ke database
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitle,
                message: `${notifMessage}. Kode: ${kodeLaporan}`,
                ref_id: id,
                ref_type: 'LAPORAN'
            });

            console.log(`💾 Notifikasi tersimpan di database untuk Laporan ID: ${id}`);

            // 4. Kirim notifikasi real-time via WebSocket
            const io = req.app.get('socketio');

            io.to(targetUserId).emit("notifikasi_status", {
                laporan_id: id,
                title: notifTitle,
                message: notifMessage,
                status_baru: status,
                timestamp: new Date()
            });

            console.log(`🔔 Notifikasi real-time dikirim ke User ID: ${targetUserId}`);
        }

        res.json({ 
            message: "Status berhasil diupdate dan notifikasi dikirim ke pelapor." 
        });

    } catch (error) {
        console.error("Error updateStatus:", error);
        res.status(500).json({ message: "Gagal update status laporan" });
    }
};

// GET /api/laporan/check-active - Cek apakah user punya laporan aktif
const checkActiveLaporan = async (req, res) => {
    try {
        const userId = req.user.id;
        
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

        // Cek laporan aktif
        const [activeLaporan] = await db.execute(
            `SELECT laporan_id, jenis_kekerasan, status, tanggal 
             FROM laporan 
             WHERE mahasiswa_id = ? 
             AND status NOT IN ('Selesai', 'Ditolak')
             LIMIT 1`,
            [mahasiswa_id]
        );

        if (activeLaporan.length > 0) {
            return res.json({
                has_active: true,
                can_create: false,
                laporan_aktif: {
                    laporan_id: activeLaporan[0].laporan_id,
                    kode_laporan: `LP-${String(activeLaporan[0].laporan_id).padStart(6, '0')}KV`,
                    jenis_kekerasan: activeLaporan[0].jenis_kekerasan,
                    status: activeLaporan[0].status,
                    tanggal: activeLaporan[0].tanggal
                },
                message: "Anda masih memiliki laporan yang sedang diproses."
            });
        }

        res.json({
            has_active: false,
            can_create: true,
            message: "Anda dapat membuat laporan baru."
        });

    } catch (error) {
        console.error("Error checkActiveLaporan:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

module.exports = {
    createLaporan,
    getMyLaporan,
    updateStatusLaporan,
    checkActiveLaporan
};