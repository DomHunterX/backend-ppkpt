const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const riwayatController = require('../controllers/riwayatController');

// GET /api/riwayat-laporan/:laporan_id - Ambil riwayat timeline laporan
router.get('/riwayat-laporan/:laporan_id', auth, riwayatController.getRiwayatLaporan);

module.exports = router;
