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
            n.*,
            DATE_FORMAT(n.created_at, '%d %b %Y %H:%i') as formatted_date
        FROM notifications n
        ORDER BY n.created_at DESC
        LIMIT ?
    `;
    
    const [rows] = await db.execute(query, [limit]);
    return rows;
};

// Fungsi untuk mendapatkan notifikasi berdasarkan ref_id (misalnya laporan_id)
const getNotificationsByRefId = async (ref_id, ref_type) => {
    const query = `
        SELECT 
            n.*,
            DATE_FORMAT(n.created_at, '%d %b %Y %H:%i') as formatted_date
        FROM notifications n
        WHERE n.ref_id = ? AND n.ref_type = ?
        ORDER BY n.created_at DESC
    `;
    
    const [rows] = await db.execute(query, [ref_id, ref_type]);
    return rows;
};

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationsByRefId
};
