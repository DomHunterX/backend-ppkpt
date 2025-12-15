const notificationModel = require('../models/notificationModel');

// GET /api/notifications - Ambil semua notifikasi (untuk monitoring/admin)
const getAllNotifications = async (req, res) => {
    try {
        const limit = req.query.limit || 50;
        const notifications = await notificationModel.getAllNotifications(limit);

        res.json({
            message: "Berhasil mengambil data notifikasi",
            total: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error("Error getAllNotifications:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// GET /api/notifications/laporan/:laporan_id - Ambil notifikasi berdasarkan laporan_id
const getNotificationsByLaporan = async (req, res) => {
    try {
        const { laporan_id } = req.params;
        const notifications = await notificationModel.getNotificationsByRefId(laporan_id, 'LAPORAN');

        res.json({
            message: "Berhasil mengambil notifikasi laporan",
            laporan_id: parseInt(laporan_id),
            total: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error("Error getNotificationsByLaporan:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// GET /api/notifications/me - Ambil notifikasi untuk user yang login (untuk mobile app)
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // dari middleware auth
        const limit = req.query.limit || 50;
        
        const notifications = await notificationModel.getNotificationsByUserId(userId, limit);

        res.json({
            message: "Berhasil mengambil notifikasi Anda",
            user_id: userId,
            total: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error("Error getMyNotifications:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

module.exports = {
    getAllNotifications,
    getNotificationsByLaporan,
    getMyNotifications
};
