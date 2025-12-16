const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// GET /api/notifications/user - Ambil notifikasi user yang login dengan pagination & filter
router.get('/notifications/user', auth, notificationController.getMyNotifications);

// GET /api/notifications/user/unread-count - Hitung notifikasi belum dibaca
router.get('/notifications/user/unread-count', auth, notificationController.getUnreadCount);

// PUT /api/notifications/read-all - Mark semua notifikasi sebagai dibaca
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - Mark notifikasi sebagai dibaca
router.put('/notifications/:id/read', auth, notificationController.markAsRead);

// GET /api/notifications - Ambil semua notifikasi (untuk admin/monitoring)
router.get('/notifications', auth, notificationController.getAllNotifications);

// GET /api/notifications/laporan/:laporan_id - Ambil notifikasi berdasarkan laporan
router.get('/notifications/laporan/:laporan_id', auth, notificationController.getNotificationsByLaporan);

module.exports = router;
