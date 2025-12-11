const { db } = require('../config/database');

// Fungsi untuk mendapatkan riwayat laporan berdasarkan laporan_id
const getRiwayatByLaporanId = async (laporan_id) => {
    const query = `
        SELECT 
            r.id,
            r.laporan_id,
            r.pelapor_id,
            r.pelapor_role,
            r.aksi,
            r.status_sebelumnya,
            r.status_baru,
            r.catatan,
            r.created_at,
            DATE_FORMAT(r.created_at, '%d %b') as tanggal_format,
            DATE_FORMAT(r.created_at, '%H:%i') as waktu_format
        FROM riwayat_laporan r
        WHERE r.laporan_id = ?
        ORDER BY r.created_at DESC
    `;
    
    const [rows] = await db.execute(query, [laporan_id]);
    return rows;
};

// Fungsi untuk mendapatkan detail laporan dengan info admin/satgas
const getDetailLaporanById = async (laporan_id) => {
    const query = `
        SELECT 
            l.*,
            m.nim,
            m.full_name as nama_pelapor,
            m.jurusan,
            m.phone_number,
            u.role
        FROM laporan l
        JOIN mahasiswa m ON l.mahasiswa_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE l.laporan_id = ?
        LIMIT 1
    `;
    
    const [rows] = await db.execute(query, [laporan_id]);
    return rows[0];
};

module.exports = {
    getRiwayatByLaporanId,
    getDetailLaporanById
};
