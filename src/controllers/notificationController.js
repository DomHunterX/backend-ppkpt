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

// GET /api/notifications/user - Ambil notifikasi untuk user yang login (dengan pagination & filter)
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // dari middleware auth
        
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            unreadOnly: req.query.unread === 'true',
            days: req.query.days ? parseInt(req.query.days) : null
        };
        
        const result = await notificationModel.getNotificationsByUserId(userId, options);

        res.json({
            message: "Berhasil mengambil notifikasi",
            user_id: userId,
            ...result
        });

    } catch (error) {
        console.error("Error getMyNotifications:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// GET /api/notifications/user/unread-count - Hitung jumlah notifikasi yang belum dibaca
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await notificationModel.getUnreadCount(userId);

        res.json({
            message: "Berhasil mengambil jumlah notifikasi belum dibaca",
            user_id: userId,
            unread_count: count
        });

    } catch (error) {
        console.error("Error getUnreadCount:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// PUT /api/notifications/:id/read - Mark notifikasi sebagai dibaca
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await notificationModel.markAsRead(id, userId);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Notifikasi tidak ditemukan atau bukan milik Anda"
            });
        }

        res.json({
            message: "Notifikasi berhasil ditandai sebagai dibaca",
            notification_id: parseInt(id)
        });

    } catch (error) {
        console.error("Error markAsRead:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// PUT /api/notifications/read-all - Mark semua notifikasi sebagai dibaca
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await notificationModel.markAllAsRead(userId);

        res.json({
            message: "Semua notifikasi berhasil ditandai sebagai dibaca",
            user_id: userId,
            updated_count: result.affectedRows
        });

    } catch (error) {
        console.error("Error markAllAsRead:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

module.exports = {
    getAllNotifications,
    getNotificationsByLaporan,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
