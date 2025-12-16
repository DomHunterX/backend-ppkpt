const { db } = require('../config/database');

// Fungsi untuk membuat laporan baru
const createLaporan = async (data) => {
    const {
        mahasiswa_id,
        nama,
        nomor_telepon,
        domisili,
        tanggal,
        jenis_kekerasan,
        cerita_peristiwa,
        pelampiran_bukti,
        disabilitas,
        status_pelapor,
        alasan,
        alasan_lainnya,
        pendampingan
    } = data;

    const query = `
        INSERT INTO laporan (
            mahasiswa_id,
            nama,
            nomor_telepon,
            domisili,
            tanggal,
            jenis_kekerasan,
            cerita_peristiwa,
            pelampiran_bukti,
            disabilitas,
            status_pelapor,
            alasan,
            alasan_lainnya,
            pendampingan,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dalam Proses')
    `;

    const [result] = await db.execute(query, [
        mahasiswa_id,
        nama || null,
        nomor_telepon || null,
        domisili || null,
        tanggal,
        jenis_kekerasan || null,
        cerita_peristiwa || null,
        pelampiran_bukti || null,
        disabilitas || null,
        status_pelapor || null,
        alasan || null,
        alasan_lainnya || null,
        pendampingan || null
    ]);

    return result;
};

// Fungsi untuk mendapatkan semua laporan berdasarkan mahasiswa_id
// Dengan join ke riwayat_laporan untuk ambil tanggal & jam pembuatan
const getLaporanByMahasiswaId = async (mahasiswa_id) => {
    const query = `
        SELECT 
            l.*,
            r.created_at as tanggal_dibuat,
            DATE_FORMAT(r.created_at, '%H:%i') as jam_dibuat,
            DATE_FORMAT(r.created_at, '%d %b') as tanggal_format
        FROM laporan l
        LEFT JOIN riwayat_laporan r ON l.laporan_id = r.laporan_id AND r.aksi = 'Laporan Dibuat'
        WHERE l.mahasiswa_id = ?
        ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(query, [mahasiswa_id]);
    return rows;
};

// Fungsi untuk mendapatkan semua laporan (untuk admin)
const getAllLaporan = async (filters = {}) => {
    let query = `
        SELECT 
            l.*,
            m.nim as npm,
            m.full_name,
            m.jurusan,
            u.identity_number,
            r.created_at as tanggal_dibuat,
            DATE_FORMAT(r.created_at, '%H:%i') as jam_dibuat,
            DATE_FORMAT(r.created_at, '%d %b %Y') as tanggal_format
        FROM laporan l
        JOIN mahasiswa m ON l.mahasiswa_id = m.id
        JOIN users u ON m.user_id = u.id
        LEFT JOIN riwayat_laporan r ON l.laporan_id = r.laporan_id AND r.aksi = 'Laporan Dibuat'
        WHERE 1=1
    `;

    const params = [];

    // Filter by status
    if (filters.status) {
        query += ` AND l.status = ?`;
        params.push(filters.status);
    }

    // Filter by verifikasi (belum/sudah verifikasi)
    if (filters.verifikasi === 'belum') {
        query += ` AND l.status = 'Dalam Proses'`;
    } else if (filters.verifikasi === 'sudah') {
        query += ` AND l.status != 'Dalam Proses'`;
    }

    // Search by nama, npm, jenis kekerasan
    if (filters.search) {
        query += ` AND (l.nama LIKE ? OR m.nim LIKE ? OR m.full_name LIKE ? OR l.jenis_kekerasan LIKE ?)`;
        const searchParam = `%${filters.search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Order by
    query += ` ORDER BY r.created_at DESC`;

    // Pagination
    if (filters.limit) {
        const limit = parseInt(filters.limit);
        const offset = filters.page ? (parseInt(filters.page) - 1) * limit : 0;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
    }

    const [rows] = await db.execute(query, params);
    return rows;
};

// Fungsi untuk mendapatkan detail laporan by ID
const getLaporanById = async (laporan_id) => {
    const query = `
        SELECT 
            l.*,
            m.nim as npm,
            m.full_name,
            m.jurusan as prodi,
            m.phone_number,
            u.identity_number,
            u.role,
            r.created_at as tanggal_dibuat,
            DATE_FORMAT(r.created_at, '%d %M %Y %H:%i') as tanggal_lengkap
        FROM laporan l
        JOIN mahasiswa m ON l.mahasiswa_id = m.id
        JOIN users u ON m.user_id = u.id
        LEFT JOIN riwayat_laporan r ON l.laporan_id = r.laporan_id AND r.aksi = 'Laporan Dibuat'
        WHERE l.laporan_id = ?
        LIMIT 1
    `;
    const [rows] = await db.execute(query, [laporan_id]);
    return rows[0] || null;
};

// Fungsi untuk verifikasi laporan (ubah status dari "Dalam Proses" ke "Ditinjau")
const verifikasiLaporan = async (laporan_id, admin_id, catatan = null) => {
    const query = `
        UPDATE laporan 
        SET status = 'Ditinjau', 
            alasan_lainnya = CONCAT(IFNULL(alasan_lainnya, ''), '\n\nDiverifikasi oleh Admin: ', ?)
        WHERE laporan_id = ? AND status = 'Dalam Proses'
    `;
    const [result] = await db.execute(query, [catatan || 'Laporan telah diverifikasi', laporan_id]);
    return result;
};

// Fungsi untuk count laporan berdasarkan status
const countLaporanByStatus = async () => {
    const query = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Dalam Proses' THEN 1 ELSE 0 END) as belum_verifikasi,
            SUM(CASE WHEN status = 'Ditinjau' THEN 1 ELSE 0 END) as ditinjau,
            SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai,
            SUM(CASE WHEN status = 'Ditolak' THEN 1 ELSE 0 END) as ditolak
        FROM laporan
    `;
    const [rows] = await db.execute(query);
    return rows[0];
};

module.exports = {
    createLaporan,
    getLaporanByMahasiswaId,
    getAllLaporan,
    getLaporanById,
    verifikasiLaporan,
    countLaporanByStatus
};
