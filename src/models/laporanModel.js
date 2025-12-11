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

module.exports = {
    createLaporan,
    getLaporanByMahasiswaId
};
