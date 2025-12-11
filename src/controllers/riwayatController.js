const riwayatModel = require('../models/riwayatModel');
const { db } = require('../config/database');

// GET /api/riwayat-laporan/:laporan_id - Detail riwayat timeline laporan
const getRiwayatLaporan = async (req, res) => {
    try {
        const { laporan_id } = req.params;
        const userId = req.user.id;

        // 1. Cek apakah laporan ini milik user yang login
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

        // 2. Verifikasi kepemilikan laporan
        const [laporanRows] = await db.execute(
            'SELECT laporan_id, mahasiswa_id, status, jenis_kekerasan FROM laporan WHERE laporan_id = ? AND mahasiswa_id = ? LIMIT 1',
            [laporan_id, mahasiswa_id]
        );

        if (!laporanRows.length) {
            return res.status(403).json({ 
                message: "Anda tidak memiliki akses ke laporan ini." 
            });
        }

        const laporanInfo = laporanRows[0];

        // 3. Ambil detail laporan lengkap
        const detailLaporan = await riwayatModel.getDetailLaporanById(laporan_id);

        // 4. Ambil riwayat timeline
        const riwayat = await riwayatModel.getRiwayatByLaporanId(laporan_id);

        // 5. Format response sesuai UI Flutter
        res.json({
            message: "Berhasil mengambil riwayat laporan",
            laporan: {
                laporan_id: laporanInfo.laporan_id,
                kode_laporan: `LP-${String(laporanInfo.laporan_id).padStart(6, '0')}KV`, // Format: LP-001234KV
                jenis_kekerasan: laporanInfo.jenis_kekerasan,
                status: laporanInfo.status,
                tanggal: detailLaporan?.tanggal,
                nama: detailLaporan?.nama,
                domisili: detailLaporan?.domisili
            },
            riwayat: riwayat.map(r => ({
                id: r.id,
                tanggal: r.tanggal_format, // "24 Juni"
                waktu: r.waktu_format,     // "17:45"
                aksi: r.aksi,
                status_baru: r.status_baru,
                status_sebelumnya: r.status_sebelumnya,
                pesan: r.catatan || generatePesanDefault(r),
                pelapor_role: r.pelapor_role
            }))
        });

    } catch (error) {
        console.error("Error getRiwayatLaporan:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// Helper function untuk generate pesan default jika catatan kosong
function generatePesanDefault(riwayat) {
    if (riwayat.aksi === 'Laporan Dibuat') {
        return 'Laporan anda berhasil terkirim dan sedang di periksa';
    }
    if (riwayat.aksi === 'Status Diubah') {
        return `Status laporan diubah menjadi ${riwayat.status_baru}`;
    }
    if (riwayat.aksi === 'Laporan Diperbarui') {
        return 'Laporan anda telah diperbarui';
    }
    return 'Update laporan';
}

module.exports = {
    getRiwayatLaporan
};
