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

module.exports = router;
