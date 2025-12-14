-- ========================================
-- SUPABASE TABLE STRUCTURE
-- ========================================
-- Script ini untuk membuat tabel notifications di Supabase
-- Mirror dari tabel MySQL untuk Real-time notifications

-- 1. Buat tabel notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ref_id INTEGER,
    ref_type VARCHAR(50),
    user_id INTEGER,  -- Untuk filter notifikasi per user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat index untuk performa query
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_ref_id ON public.notifications(ref_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Policy: User hanya bisa melihat notifikasi mereka sendiri
-- (Sesuaikan dengan sistem auth Anda)
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Atau jika tidak pakai Supabase Auth, allow semua untuk testing:
CREATE POLICY "Allow all to read notifications"
ON public.notifications
FOR SELECT
USING (true);

-- 5. Policy: Backend bisa insert notifikasi (pakai service_role key)
CREATE POLICY "Backend can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- ========================================
-- ENABLE REAL-TIME
-- ========================================
-- CARA 1: Via Dashboard (RECOMMENDED)
-- 1. Buka Dashboard > Database > Replication
-- 2. Cari tabel "notifications"
-- 3. Toggle switch ke ON
-- 4. Jika tidak ada menu Replication, pakai SQL di bawah:

-- CARA 2: Via SQL
-- Jalankan satu per satu di SQL Editor:

-- Step 1: Cek apakah publication sudah ada
-- SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Step 2: Tambahkan tabel ke publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Step 3: Verifikasi (opsional)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Jika error "publication does not exist", buat dulu:
-- CREATE PUBLICATION supabase_realtime;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ========================================
-- NOTES:
-- ========================================
-- 1. Setelah buat tabel, enable Real-time di Dashboard:
--    Database > Replication > notifications (toggle ON)
--
-- 2. Get Supabase credentials:
--    Settings > API > Project URL & anon public key
--
-- 3. Update .env backend:
--    SUPABASE_URL=https://xxx.supabase.co
--    SUPABASE_ANON_KEY=eyJxxx...
--
-- 4. Flutter akan listen INSERT events dari tabel ini
