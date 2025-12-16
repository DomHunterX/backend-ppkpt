// Cron job untuk auto-cleanup notifikasi lama
// Jalankan setiap hari jam 2 pagi

const cron = require('node-cron');
const notificationModel = require('../models/notificationModel');

// Cron format: second minute hour day month weekday
// '0 2 * * *' = Setiap hari jam 2:00 pagi

const startNotificationCleanup = () => {
    // Jalankan setiap hari jam 2 pagi
    cron.schedule('0 2 * * *', async () => {
        try {
            console.log('🧹 [CRON] Memulai cleanup notifikasi lama...');
            
            const result = await notificationModel.cleanupOldNotifications();
            
            console.log(`✅ [CRON] Cleanup selesai! ${result.affectedRows} notifikasi dihapus`);
            console.log(`📊 [CRON] Waktu: ${new Date().toLocaleString('id-ID')}`);
            
        } catch (error) {
            console.error('❌ [CRON] Error saat cleanup notifikasi:', error.message);
        }
    });

    console.log('⏰ Cron job notification cleanup berhasil diaktifkan (setiap hari jam 02:00)');
};

module.exports = { startNotificationCleanup };
