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

        // 6. Simpan notifikasi ke database (MySQL + Supabase)
        await notificationModel.createNotification({
            type: 'LAPORAN_BARU',
            title: notifTitle,
            message: `${notifMessage}. Kode: ${kodeLaporan}`,
            ref_id: result.insertId,
            ref_type: 'LAPORAN',
            user_id: userId  // 🔥 TAMBAH: Untuk Supabase real-time filter
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

        // 7b. Ambil semua admin & super_admin untuk simpan notifikasi
        const [adminUsers] = await db.execute(
            `SELECT id FROM users WHERE role IN ('admin', 'super_admin')`
        );

        const notifTitleAdmin = "Laporan Baru Masuk";
        const notifMessageAdmin = `Laporan ${req.body.jenis_kekerasan} dari ${req.body.nama} telah masuk dan menunggu ditinjau`;

        // 7c. Simpan notifikasi untuk setiap admin
        for (const admin of adminUsers) {
            await notificationModel.createNotification({
                type: 'LAPORAN_BARU',
                title: notifTitleAdmin,
                message: `${notifMessageAdmin}. Kode: ${kodeLaporan}`,
                ref_id: result.insertId,
                ref_type: 'LAPORAN',
                user_id: admin.id
            });
        }

        console.log(`💾 Notifikasi tersimpan untuk ${adminUsers.length} admin`);

        // 7d. Broadcast ke SEMUA ADMIN & SUPER ADMIN (group notification)
        io.to('admin_room').emit("notifikasi_laporan_admin", {
            laporan_id: result.insertId,
            kode_laporan: kodeLaporan,
            title: notifTitleAdmin,
            message: notifMessageAdmin,
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

            // 3. Simpan notifikasi ke database (MySQL + Supabase)
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitle,
                message: `${notifMessage}. Kode: ${kodeLaporan}`,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: targetUserId  // 🔥 TAMBAH: Untuk Supabase real-time filter
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

// ========== ADMIN ENDPOINTS ==========

// GET /api/admin/laporan - List semua laporan untuk admin
const getAllLaporanAdmin = async (req, res) => {
    try {
        // Cek role admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ 
                message: "Akses ditolak. Hanya admin yang dapat mengakses." 
            });
        }

        const filters = {
            status: req.query.status,          // 'Dalam Proses', 'Ditinjau', 'Selesai', 'Ditolak'
            verifikasi: req.query.verifikasi,  // 'belum', 'sudah'
            search: req.query.search,
            page: req.query.page || 1,
            limit: req.query.limit || 10
        };

        const laporan = await laporanModel.getAllLaporan(filters);
        const stats = await laporanModel.countLaporanByStatus();

        // Mapping bulan Inggris ke Indonesia
        const bulanMap = {
            'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
            'May': 'Mei', 'Jun': 'Juni', 'Jul': 'Juli', 'Aug': 'Agu',
            'Sep': 'Sep', 'Oct': 'Okt', 'Nov': 'Nov', 'Dec': 'Des'
        };

        const formattedLaporan = laporan.map(item => {
            let tanggalID = item.tanggal_format;
            if (tanggalID) {
                Object.keys(bulanMap).forEach(key => {
                    tanggalID = tanggalID.replace(key, bulanMap[key]);
                });
            }

            return {
                laporan_id: item.laporan_id,
                kode_laporan: `LP-${String(item.laporan_id).padStart(6, '0')}KV`,
                nama: item.nama,
                npm: item.npm,
                jenis_kekerasan: item.jenis_kekerasan,
                status: item.status,
                jam: item.jam_dibuat,
                tanggal: tanggalID,
                domisili: item.domisili
            };
        });

        res.json({
            message: "Berhasil mengambil data laporan",
            statistics: {
                total: stats.total,
                belum_verifikasi: stats.belum_verifikasi,
                ditinjau: stats.ditinjau,
                selesai: stats.selesai,
                ditolak: stats.ditolak
            },
            data: formattedLaporan,
            pagination: {
                page: parseInt(filters.page),
                limit: parseInt(filters.limit),
                total: laporan.length
            }
        });

    } catch (error) {
        console.error("Error getAllLaporanAdmin:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// GET /api/admin/laporan/:id - Detail laporan untuk admin
const getLaporanDetailAdmin = async (req, res) => {
    try {
        // Cek role admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ 
                message: "Akses ditolak. Hanya admin yang dapat mengakses." 
            });
        }

        const { id } = req.params;
        const laporan = await laporanModel.getLaporanById(id);

        if (!laporan) {
            return res.status(404).json({ 
                message: "Laporan tidak ditemukan" 
            });
        }

        // Get riwayat laporan
        const [riwayat] = await db.execute(
            `SELECT * FROM riwayat_laporan WHERE laporan_id = ? ORDER BY created_at DESC`,
            [id]
        );

        res.json({
            message: "Berhasil mengambil detail laporan",
            data: {
                laporan_id: laporan.laporan_id,
                kode_laporan: `LP-${String(laporan.laporan_id).padStart(6, '0')}KV`,
                
                // Data pelapor
                nama: laporan.nama,
                npm: laporan.npm,
                full_name: laporan.full_name,
                prodi: laporan.prodi,
                nomor_telepon: laporan.nomor_telepon || laporan.phone_number,
                domisili: laporan.domisili,
                
                // Data laporan
                tanggal_kejadian: laporan.tanggal,
                tanggal_lapor: laporan.tanggal_lengkap,
                jenis_kekerasan: laporan.jenis_kekerasan,
                cerita_peristiwa: laporan.cerita_peristiwa,
                pelampiran_bukti: laporan.pelampiran_bukti,
                
                // Additional info
                disabilitas: laporan.disabilitas,
                status_pelapor: laporan.status_pelapor,
                alasan: laporan.alasan,
                alasan_lainnya: laporan.alasan_lainnya,
                pendampingan: laporan.pendampingan,
                
                // Status
                status: laporan.status,
                
                // Riwayat
                riwayat: riwayat.map(r => ({
                    aksi: r.aksi,
                    status_sebelumnya: r.status_sebelumnya,
                    status_baru: r.status_baru,
                    catatan: r.catatan,
                    tanggal: r.created_at
                }))
            }
        });

    } catch (error) {
        console.error("Error getLaporanDetailAdmin:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// PUT /api/admin/laporan/:id/verifikasi - Verifikasi laporan (ubah status ke "Verifikasi")
const verifikasiLaporan = async (req, res) => {
    try {
        // Get Socket.io instance
        const io = req.app.get('socketio');
        
        // Cek role admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ 
                message: "Akses ditolak. Hanya admin yang dapat memverifikasi." 
            });
        }

        const { id } = req.params;
        const { catatan } = req.body;

        // Cek apakah laporan ada dan masih dalam status "Dalam Proses"
        const laporan = await laporanModel.getLaporanById(id);
        if (!laporan) {
            return res.status(404).json({ 
                message: "Laporan tidak ditemukan" 
            });
        }

        if (laporan.status !== 'Dalam Proses') {
            return res.status(400).json({ 
                message: `Laporan sudah berstatus "${laporan.status}". Hanya laporan dengan status "Dalam Proses" yang dapat diverifikasi.` 
            });
        }

        // Update status ke "Verifikasi"
        await db.execute(
            `UPDATE laporan SET status = 'Verifikasi', catatan_tindak_lanjut = ? WHERE laporan_id = ?`,
            [catatan || 'Laporan telah diverifikasi oleh admin', id]
        );

        // Catat riwayat
        await db.execute(
            `INSERT INTO riwayat_laporan (laporan_id, pelapor_id, pelapor_role, aksi, status_sebelumnya, status_baru, catatan) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, laporan.mahasiswa_id, laporan.status_pelapor || 'Mahasiswa', 'Status Diubah', 'Dalam Proses', 'Verifikasi', catatan || 'Laporan telah diverifikasi oleh admin']
        );

        // Kirim notifikasi ke mahasiswa
        const kodeLaporan = `LP-${String(id).padStart(6, '0')}KV`;
        const notifTitle = "Laporan Telah Diverifikasi";
        const notifMessage = `Laporan ${laporan.jenis_kekerasan} Anda (${kodeLaporan}) telah diverifikasi dan sedang dalam tahap verifikasi`;

        // Get user_id mahasiswa
        const [mahasiswa] = await db.execute(
            `SELECT user_id FROM mahasiswa WHERE id = ?`,
            [laporan.mahasiswa_id]
        );

        if (mahasiswa.length > 0) {
            const targetUserId = mahasiswa[0].user_id;

            // Simpan notifikasi ke database
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitle,
                message: notifMessage,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: targetUserId
            });

            // Kirim real-time notification
            io.to(String(targetUserId)).emit("notifikasi_status", {
                laporan_id: id,
                title: notifTitle,
                message: notifMessage,
                status_baru: "Verifikasi",
                timestamp: new Date()
            });

            console.log(`🔔 Notifikasi verifikasi dikirim ke User ID: ${targetUserId}`);
        }

        // Kirim notifikasi ke admin lain (bukan yang verifikasi)
        const [otherAdmins] = await db.execute(
            `SELECT u.id, u.identity_number, a.full_name 
             FROM users u 
             LEFT JOIN admin a ON u.id = a.user_id 
             WHERE u.role IN ('admin', 'super_admin') AND u.id != ?`,
            [req.user.id]
        );

        const [currentAdmin] = await db.execute(
            `SELECT u.identity_number, a.full_name 
             FROM users u 
             LEFT JOIN admin a ON u.id = a.user_id 
             WHERE u.id = ?`,
            [req.user.id]
        );

        const adminName = currentAdmin[0]?.full_name || currentAdmin[0]?.identity_number || 'Admin';
        const notifTitleAdmin = "Laporan Diverifikasi";
        const notifMessageAdmin = `${adminName} telah memverifikasi laporan ${kodeLaporan}`;

        // Simpan notifikasi untuk setiap admin lain
        for (const admin of otherAdmins) {
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitleAdmin,
                message: notifMessageAdmin,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: admin.id
            });
        }

        // Broadcast ke admin room
        io.to('admin_room').emit("notifikasi_admin", {
            laporan_id: id,
            kode_laporan: kodeLaporan,
            title: notifTitleAdmin,
            message: notifMessageAdmin,
            admin: adminName,
            timestamp: new Date()
        });

        console.log(`📢 Notifikasi verifikasi dikirim ke ${otherAdmins.length} admin lain`);

        res.json({
            message: "Laporan berhasil diverifikasi",
            laporan_id: id,
            kode_laporan: kodeLaporan,
            status_baru: "Verifikasi"
        });

    } catch (error) {
        console.error("Error verifikasiLaporan:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// PUT /api/admin/laporan/:id/proses - Proses lanjutan laporan
const prosesLaporan = async (req, res) => {
    try {
        // Get Socket.io instance
        const io = req.app.get('socketio');
        
        // Cek role admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ 
                message: "Akses ditolak. Hanya admin yang dapat memproses." 
            });
        }

        const { id } = req.params;
        const { catatan } = req.body;

        // Cek apakah laporan ada
        const laporan = await laporanModel.getLaporanById(id);
        if (!laporan) {
            return res.status(404).json({ 
                message: "Laporan tidak ditemukan" 
            });
        }

        if (laporan.status !== 'Verifikasi') {
            return res.status(400).json({ 
                message: `Laporan harus dalam status "Verifikasi" untuk dapat diproses. Status saat ini: "${laporan.status}"` 
            });
        }

        // Update status ke "Proses Lanjutan"
        await db.execute(
            `UPDATE laporan SET status = 'Proses Lanjutan', catatan_tindak_lanjut = ? WHERE laporan_id = ?`,
            [catatan || 'Laporan sedang dalam proses lanjutan', id]
        );

        // Catat riwayat
        await db.execute(
            `INSERT INTO riwayat_laporan (laporan_id, pelapor_id, pelapor_role, aksi, status_sebelumnya, status_baru, catatan) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, laporan.mahasiswa_id, laporan.status_pelapor || 'Mahasiswa', 'Status Diubah', 'Verifikasi', 'Proses Lanjutan', catatan || 'Laporan sedang dalam proses lanjutan']
        );

        // Kirim notifikasi ke mahasiswa
        const kodeLaporan = `LP-${String(id).padStart(6, '0')}KV`;
        const notifTitle = "Laporan Dalam Proses Lanjutan";
        const notifMessage = `Laporan ${laporan.jenis_kekerasan} Anda (${kodeLaporan}) sedang dalam proses penanganan lanjutan`;

        // Get user_id mahasiswa
        const [mahasiswa] = await db.execute(
            `SELECT user_id FROM mahasiswa WHERE id = ?`,
            [laporan.mahasiswa_id]
        );

        if (mahasiswa.length > 0) {
            const targetUserId = mahasiswa[0].user_id;

            // Simpan notifikasi
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitle,
                message: notifMessage,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: targetUserId
            });

            // Real-time notification
            io.to(String(targetUserId)).emit("notifikasi_status", {
                laporan_id: id,
                title: notifTitle,
                message: notifMessage,
                status_baru: "Proses Lanjutan",
                timestamp: new Date()
            });

            console.log(`🔔 Notifikasi proses lanjutan dikirim ke User ID: ${targetUserId}`);
        }

        // Kirim notifikasi hanya ke SUPER ADMIN
        const [superAdmins] = await db.execute(
            `SELECT u.id FROM users u WHERE u.role = 'super_admin'`
        );

        const [currentAdmin] = await db.execute(
            `SELECT u.identity_number, a.full_name 
             FROM users u 
             LEFT JOIN admin a ON u.id = a.user_id 
             WHERE u.id = ?`,
            [req.user.id]
        );

        const adminName = currentAdmin[0]?.full_name || currentAdmin[0]?.identity_number || 'Admin';
        const notifTitleSuperAdmin = "Laporan Dalam Proses Lanjutan";
        const notifMessageSuperAdmin = `${adminName} memproses lanjut laporan ${kodeLaporan}`;

        // Simpan notifikasi untuk setiap super admin (untuk monitoring & audit trail)
        for (const superAdmin of superAdmins) {
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitleSuperAdmin,
                message: notifMessageSuperAdmin,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: superAdmin.id
            });
        }

        // Broadcast ke super_admin room untuk real-time notification
        io.to('super_admin_room').emit("notifikasi_super_admin", {
            laporan_id: id,
            kode_laporan: kodeLaporan,
            title: notifTitleSuperAdmin,
            message: notifMessageSuperAdmin,
            admin: adminName,
            timestamp: new Date()
        });

        console.log(`📢 Notifikasi proses lanjutan dikirim ke ${superAdmins.length} super admin`);

        res.json({
            message: "Laporan berhasil diproses lanjut",
            laporan_id: id,
            kode_laporan: kodeLaporan,
            status_baru: "Proses Lanjutan"
        });

    } catch (error) {
        console.error("Error prosesLaporan:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// PUT /api/admin/laporan/:id/selesai - Selesaikan laporan
const selesaikanLaporan = async (req, res) => {
    try {
        // Get Socket.io instance
        const io = req.app.get('socketio');
        
        // Cek role admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ 
                message: "Akses ditolak. Hanya admin yang dapat menyelesaikan." 
            });
        }

        const { id } = req.params;
        const { catatan } = req.body;

        // Cek apakah laporan ada
        const laporan = await laporanModel.getLaporanById(id);
        if (!laporan) {
            return res.status(404).json({ 
                message: "Laporan tidak ditemukan" 
            });
        }

        if (laporan.status === 'Selesai') {
            return res.status(400).json({ 
                message: "Laporan sudah berstatus Selesai" 
            });
        }

        if (laporan.status === 'Ditolak') {
            return res.status(400).json({ 
                message: "Laporan yang ditolak tidak dapat diselesaikan" 
            });
        }

        // Update status ke "Selesai"
        await db.execute(
            `UPDATE laporan SET status = 'Selesai', catatan_tindak_lanjut = ? WHERE laporan_id = ?`,
            [catatan || 'Laporan telah diselesaikan', id]
        );

        // Catat riwayat
        await db.execute(
            `INSERT INTO riwayat_laporan (laporan_id, pelapor_id, pelapor_role, aksi, status_sebelumnya, status_baru, catatan) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, laporan.mahasiswa_id, laporan.status_pelapor || 'Mahasiswa', 'Status Diubah', laporan.status, 'Selesai', catatan || 'Laporan telah diselesaikan']
        );

        // Kirim notifikasi ke mahasiswa
        const kodeLaporan = `LP-${String(id).padStart(6, '0')}KV`;
        const notifTitle = "Laporan Telah Selesai";
        const notifMessage = `Laporan ${laporan.jenis_kekerasan} Anda (${kodeLaporan}) telah selesai ditangani`;

        // Get user_id mahasiswa
        const [mahasiswa] = await db.execute(
            `SELECT user_id FROM mahasiswa WHERE id = ?`,
            [laporan.mahasiswa_id]
        );

        if (mahasiswa.length > 0) {
            const targetUserId = mahasiswa[0].user_id;

            // Simpan notifikasi
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitle,
                message: notifMessage,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: targetUserId
            });

            // Real-time notification
            io.to(String(targetUserId)).emit("notifikasi_status", {
                laporan_id: id,
                title: notifTitle,
                message: notifMessage,
                status_baru: "Selesai",
                timestamp: new Date()
            });

            console.log(`🔔 Notifikasi selesai dikirim ke User ID: ${targetUserId}`);
        }

        // Kirim notifikasi hanya ke SUPER ADMIN
        const [superAdmins] = await db.execute(
            `SELECT u.id FROM users u WHERE u.role = 'super_admin'`
        );

        const [currentAdmin] = await db.execute(
            `SELECT u.identity_number, a.full_name 
             FROM users u 
             LEFT JOIN admin a ON u.id = a.user_id 
             WHERE u.id = ?`,
            [req.user.id]
        );

        const adminName = currentAdmin[0]?.full_name || currentAdmin[0]?.identity_number || 'Admin';
        const notifTitleSuperAdmin = "Laporan Diselesaikan";
        const notifMessageSuperAdmin = `${adminName} telah menyelesaikan laporan ${kodeLaporan}`;

        // Simpan notifikasi untuk setiap super admin (untuk monitoring & audit trail)
        for (const superAdmin of superAdmins) {
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitleSuperAdmin,
                message: notifMessageSuperAdmin,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: superAdmin.id
            });
        }

        // Broadcast ke super_admin room untuk real-time notification
        io.to('super_admin_room').emit("notifikasi_super_admin", {
            laporan_id: id,
            kode_laporan: kodeLaporan,
            title: notifTitleSuperAdmin,
            message: notifMessageSuperAdmin,
            admin: adminName,
            timestamp: new Date()
        });

        console.log(`📢 Notifikasi selesai dikirim ke ${superAdmins.length} super admin`);

        res.json({
            message: "Laporan berhasil diselesaikan",
            laporan_id: id,
            kode_laporan: kodeLaporan,
            status_baru: "Selesai"
        });

    } catch (error) {
        console.error("Error selesaikanLaporan:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// PUT /api/admin/laporan/:id/tolak - Tolak laporan
const tolakLaporan = async (req, res) => {
    try {
        // Get Socket.io instance
        const io = req.app.get('socketio');
        
        // Cek role admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ 
                message: "Akses ditolak. Hanya admin yang dapat menolak." 
            });
        }

        const { id } = req.params;
        const { alasan } = req.body;

        if (!alasan || alasan.trim() === '') {
            return res.status(400).json({ 
                message: "Alasan penolakan wajib diisi" 
            });
        }

        // Cek apakah laporan ada
        const laporan = await laporanModel.getLaporanById(id);
        if (!laporan) {
            return res.status(404).json({ 
                message: "Laporan tidak ditemukan" 
            });
        }

        if (laporan.status === 'Ditolak') {
            return res.status(400).json({ 
                message: "Laporan sudah ditolak sebelumnya" 
            });
        }

        if (laporan.status === 'Selesai') {
            return res.status(400).json({ 
                message: "Laporan yang sudah selesai tidak dapat ditolak" 
            });
        }

        // Update status ke "Ditolak"
        await db.execute(
            `UPDATE laporan SET status = 'Ditolak', catatan_tindak_lanjut = ? WHERE laporan_id = ?`,
            [alasan, id]
        );

        // Catat riwayat
        await db.execute(
            `INSERT INTO riwayat_laporan (laporan_id, pelapor_id, pelapor_role, aksi, status_sebelumnya, status_baru, catatan) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, laporan.mahasiswa_id, laporan.status_pelapor || 'Mahasiswa', 'Status Diubah', laporan.status, 'Ditolak', alasan]
        );

        // Kirim notifikasi ke MAHASISWA
        const kodeLaporan = `LP-${String(id).padStart(6, '0')}KV`;
        const notifTitle = "Laporan Ditolak";
        const notifMessage = `Laporan ${laporan.jenis_kekerasan} Anda (${kodeLaporan}) ditolak. Alasan: ${alasan}`;

        // Get user_id mahasiswa
        const [mahasiswa] = await db.execute(
            `SELECT user_id FROM mahasiswa WHERE id = ?`,
            [laporan.mahasiswa_id]
        );

        if (mahasiswa.length > 0) {
            const targetUserId = mahasiswa[0].user_id;

            // Simpan notifikasi
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitle,
                message: notifMessage,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: targetUserId
            });

            // Real-time notification
            io.to(String(targetUserId)).emit("notifikasi_status", {
                laporan_id: id,
                title: notifTitle,
                message: notifMessage,
                status_baru: "Ditolak",
                timestamp: new Date()
            });

            console.log(`🔔 Notifikasi penolakan dikirim ke User ID: ${targetUserId}`);
        }

        // Kirim notifikasi ke SUPER ADMIN
        const [superAdmins] = await db.execute(
            `SELECT u.id FROM users u WHERE u.role = 'super_admin'`
        );

        const [currentAdmin] = await db.execute(
            `SELECT u.identity_number, a.full_name 
             FROM users u 
             LEFT JOIN admin a ON u.id = a.user_id 
             WHERE u.id = ?`,
            [req.user.id]
        );

        const adminName = currentAdmin[0]?.full_name || currentAdmin[0]?.identity_number || 'Admin';
        const notifTitleSuperAdmin = "Laporan Ditolak";
        const notifMessageSuperAdmin = `${adminName} menolak laporan ${kodeLaporan}. Alasan: ${alasan}`;

        // Simpan notifikasi untuk setiap super admin (untuk monitoring & audit trail)
        for (const superAdmin of superAdmins) {
            await notificationModel.createNotification({
                type: 'STATUS_LAPORAN',
                title: notifTitleSuperAdmin,
                message: notifMessageSuperAdmin,
                ref_id: id,
                ref_type: 'LAPORAN',
                user_id: superAdmin.id
            });
        }

        // Broadcast ke super_admin room untuk real-time notification
        io.to('super_admin_room').emit("notifikasi_super_admin", {
            laporan_id: id,
            kode_laporan: kodeLaporan,
            title: notifTitleSuperAdmin,
            message: notifMessageSuperAdmin,
            admin: adminName,
            alasan: alasan,
            timestamp: new Date()
        });

        console.log(`📢 Notifikasi penolakan dikirim ke ${superAdmins.length} super admin`);

        res.json({
            message: "Laporan berhasil ditolak",
            laporan_id: id,
            kode_laporan: kodeLaporan,
            status_baru: "Ditolak",
            alasan: alasan
        });

    } catch (error) {
        console.error("Error tolakLaporan:", error);
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
    checkActiveLaporan,
    // Admin endpoints
    getAllLaporanAdmin,
    getLaporanDetailAdmin,
    verifikasiLaporan,
    prosesLaporan,
    selesaikanLaporan,
    tolakLaporan
};