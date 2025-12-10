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
const getLaporanByMahasiswaId = async (mahasiswa_id) => {
    const query = `SELECT * FROM laporan WHERE mahasiswa_id = ? ORDER BY tanggal DESC`;
    const [rows] = await db.execute(query, [mahasiswa_id]);
    return rows;
};

module.exports = {
    createLaporan,
    getLaporanByMahasiswaId
};
