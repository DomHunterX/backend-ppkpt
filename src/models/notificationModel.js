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
        user_id         // BARU: Untuk filter notifikasi per user di Supabase
    } = data;

    const query = `
        INSERT INTO notifications (type, title, message, ref_id, ref_type)
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        type,
        title,
        message,
        ref_id || null,
        ref_type || null
    ]);

    // 🔥 SIMPAN KE SUPABASE (untuk Real-time)
    if (supabase) {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([{
                    notification_id: result.insertId,
                    type: type,
                    title: title,
                    message: message,
                    ref_id: ref_id || null,
                    ref_type: ref_type || null,
                    user_id: user_id || null, // Untuk filter per user
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                console.error('❌ Supabase insert error:', error.message);
            } else {
                console.log('✅ Notifikasi tersimpan di Supabase (Real-time aktif)');
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

// Fungsi untuk mendapatkan notifikasi berdasarkan user_id (untuk mobile app)
const getNotificationsByUserId = async (user_id, limit = 50) => {
    // Query untuk ambil notifikasi dari laporan yang dibuat oleh user tersebut
    const query = `
        SELECT 
            n.id,
            n.type,
            n.title,
            n.message,
            n.ref_id,
            n.ref_type,
            n.created_at
        FROM notifications n
        INNER JOIN laporan l ON n.ref_id = l.laporan_id AND n.ref_type = 'LAPORAN'
        INNER JOIN mahasiswa m ON l.mahasiswa_id = m.id
        WHERE m.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ?
    `;
    
    const [rows] = await db.execute(query, [parseInt(user_id), parseInt(limit)]);
    return rows;
};

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationsByRefId,
    getNotificationsByUserId
};
