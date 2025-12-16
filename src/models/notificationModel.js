const { db } = require('../config/database');
const { supabase } = require('../config/supabase');

// Fungsi untuk membuat notifikasi baru
const createNotification = async (data) => {
    const {
        type,           // 'LAPORAN_BARU', 'STATUS_LAPORAN', dll
        title,
        message,
        ref_id,         // laporan_id atau id lainnya
        ref_type,       // 'LAPORAN', 'EDUKASI', 'AKTIVITAS'
        user_id         // Untuk filter notifikasi per user
    } = data;

    const query = `
        INSERT INTO notifications (type, title, message, ref_id, ref_type, user_id, is_read)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `;

    const [result] = await db.execute(query, [
        type,
        title,
        message,
        ref_id || null,
        ref_type || null,
        user_id || null
    ]);

    // 🔥 SIMPAN KE SUPABASE (untuk Real-time)
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    type: type,
                    title: title,
                    message: message,
                    ref_id: ref_id || null,
                    ref_type: ref_type || null,
                    user_id: user_id || null, // Untuk filter per user
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('❌ Supabase insert error:', error.message);
            } else {
                console.log(`✅ Notifikasi tersimpan di Supabase (ID: ${data[0]?.id}, Ref: ${ref_id})`);
            }
        } catch (err) {
            console.error('❌ Supabase error:', err.message);
        }
    }

    return result;
};

// Fungsi untuk mendapatkan semua notifikasi (untuk admin/monitoring)
const getAllNotifications = async (limit = 50) => {
    const query = `
        SELECT 
            id,
            type,
            title,
            message,
            ref_id,
            ref_type,
            created_at
        FROM notifications
        ORDER BY created_at DESC
        LIMIT ?
    `;
    
    const [rows] = await db.execute(query, [parseInt(limit)]);
    return rows;
};

// Fungsi untuk mendapatkan notifikasi berdasarkan ref_id (misalnya laporan_id)
const getNotificationsByRefId = async (ref_id, ref_type) => {
    const query = `
        SELECT 
            id,
            type,
            title,
            message,
            ref_id,
            ref_type,
            created_at
        FROM notifications
        WHERE ref_id = ? AND ref_type = ?
        ORDER BY created_at DESC
    `;
    
    const [rows] = await db.execute(query, [parseInt(ref_id), ref_type]);
    return rows;
};

// Fungsi untuk mendapatkan notifikasi berdasarkan user_id dengan pagination
const getNotificationsByUserId = async (user_id, options = {}) => {
    const {
        page = 1,
        limit = 50,
        unreadOnly = false,
        days = null
    } = options;

    // FIX: Convert to number dan inline LIMIT/OFFSET (tidak pakai ?)
    const limitNum = Number(limit) || 50;
    const offsetNum = Number((page - 1) * limitNum) || 0;
    
    let whereClause = 'WHERE user_id = ?';
    const params = [parseInt(user_id)];

    // Filter hanya unread
    if (unreadOnly) {
        whereClause += ' AND is_read = 0';
    }

    // Filter by days (misal: 30 hari terakhir)
    if (days) {
        whereClause += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
        params.push(parseInt(days));
    }

    // FIX: LIMIT & OFFSET inline (bukan parameter ?)
    const query = `
        SELECT 
            id,
            type,
            title,
            message,
            ref_id,
            ref_type,
            user_id,
            is_read,
            read_at,
            created_at
        FROM notifications
        ${whereClause}
        ORDER BY is_read ASC, created_at DESC
        LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    
    const [rows] = await db.execute(query, params);

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM notifications
        ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, params);

    return {
        data: rows,
        pagination: {
            page: parseInt(page),
            limit: limitNum,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / limitNum)
        }
    };
};

// Fungsi untuk mark notification as read
const markAsRead = async (notification_id, user_id) => {
    const query = `
        UPDATE notifications 
        SET is_read = 1, read_at = NOW()
        WHERE id = ? AND user_id = ?
    `;
    
    const [result] = await db.execute(query, [parseInt(notification_id), parseInt(user_id)]);
    return result;
};

// Fungsi untuk mark all notifications as read
const markAllAsRead = async (user_id) => {
    const query = `
        UPDATE notifications 
        SET is_read = 1, read_at = NOW()
        WHERE user_id = ? AND is_read = 0
    `;
    
    const [result] = await db.execute(query, [parseInt(user_id)]);
    return result;
};

// Fungsi untuk get unread count
const getUnreadCount = async (user_id) => {
    const query = `
        SELECT COUNT(*) as unread_count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
    `;
    
    const [rows] = await db.execute(query, [parseInt(user_id)]);
    return rows[0].unread_count;
};

// Fungsi untuk auto-cleanup notifikasi lama
const cleanupOldNotifications = async () => {
    // Hapus notifikasi > 90 hari untuk mahasiswa & admin
    // Hapus notifikasi > 180 hari untuk super admin
    const query = `
        DELETE n FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE (
            (u.role IN ('mahasiswa', 'admin') AND n.created_at < DATE_SUB(NOW(), INTERVAL 90 DAY))
            OR
            (u.role = 'super_admin' AND n.created_at < DATE_SUB(NOW(), INTERVAL 180 DAY))
            OR
            (u.id IS NULL AND n.created_at < DATE_SUB(NOW(), INTERVAL 90 DAY))
        )
    `;
    
    const [result] = await db.execute(query);
    return result;
};

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationsByRefId,
    getNotificationsByUserId,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    cleanupOldNotifications
};
