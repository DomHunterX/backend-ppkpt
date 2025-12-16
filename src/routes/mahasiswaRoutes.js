const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mahasiswaController = require('../controllers/mahasiswaController');

// Semua route harus login dan role admin/super_admin
// Middleware tambahan untuk cek role bisa ditambahkan

// GET /api/mahasiswa/stats - Statistik mahasiswa
router.get('/mahasiswa/stats', auth, mahasiswaController.getMahasiswaStats);

// GET /api/mahasiswa/:id - Detail mahasiswa
router.get('/mahasiswa/:id', auth, mahasiswaController.getMahasiswaById);

// GET /api/mahasiswa - List mahasiswa
router.get('/mahasiswa', auth, mahasiswaController.getAllMahasiswa);

module.exports = router;
