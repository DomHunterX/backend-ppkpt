const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// GET /api/notifications - Ambil semua notifikasi (untuk admin/monitoring)
router.get('/notifications', auth, notificationController.getAllNotifications);

// GET /api/notifications/laporan/:laporan_id - Ambil notifikasi berdasarkan laporan
router.get('/notifications/laporan/:laporan_id', auth, notificationController.getNotificationsByLaporan);

module.exports = router;
