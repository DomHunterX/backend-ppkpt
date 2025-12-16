const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const laporanController = require('../controllers/laporanController');

// GET /api/laporan/check-active - Cek apakah user punya laporan aktif
router.get('/laporan/check-active', auth, laporanController.checkActiveLaporan);

// POST /api/laporan - Buat laporan baru (harus login)
router.post('/laporan', auth, laporanController.createLaporan);

// GET /api/laporan/me - Ambil laporan milik user login
router.get('/laporan/me', auth, laporanController.getMyLaporan);

// PATCH /api/laporan/:id/status - Update status laporan (untuk admin/satgas)
router.patch('/laporan/:id/status', auth, laporanController.updateStatusLaporan);

// ========== ADMIN ROUTES ==========
// GET /api/admin/laporan - List semua laporan (admin only)
router.get('/admin/laporan', auth, laporanController.getAllLaporanAdmin);

// GET /api/admin/laporan/:id - Detail laporan (admin only)
router.get('/admin/laporan/:id', auth, laporanController.getLaporanDetailAdmin);

// PUT /api/admin/laporan/:id/verifikasi - Verifikasi laporan (admin only)
router.put('/admin/laporan/:id/verifikasi', auth, laporanController.verifikasiLaporan);

// PUT /api/admin/laporan/:id/proses - Proses lanjutan laporan (admin only)
router.put('/admin/laporan/:id/proses', auth, laporanController.prosesLaporan);

// PUT /api/admin/laporan/:id/selesai - Selesaikan laporan (admin only)
router.put('/admin/laporan/:id/selesai', auth, laporanController.selesaikanLaporan);

// PUT /api/admin/laporan/:id/tolak - Tolak laporan (admin only)
router.put('/admin/laporan/:id/tolak', auth, laporanController.tolakLaporan);

module.exports = router;
