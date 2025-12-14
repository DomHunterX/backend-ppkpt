const { createClient } = require('@supabase/supabase-js');

// Konfigurasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// Inisialisasi Supabase (hanya jika kredensial tersedia)
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase Client initialized');
} else {
    console.log('⚠️  Supabase tidak dikonfigurasi. Notifikasi real-time hanya via WebSocket.');
}

module.exports = { supabase };
