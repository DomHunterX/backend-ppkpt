const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const laporanController = require('../controllers/laporanController');

// POST /api/laporan - Buat laporan baru (harus login)
router.post('/laporan', auth, laporanController.createLaporan);

// GET /api/laporan/me - Ambil laporan milik user login
router.get('/laporan/me', auth, laporanController.getMyLaporan);

module.exports = router;
