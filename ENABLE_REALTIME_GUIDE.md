# 🔥 QUICK FIX: Enable Real-time Supabase

## Lokasi Menu Replication

```
Dashboard Supabase
  └── Database (sidebar kiri)
      └── Replication (tab menu)
          └── Cari tabel "notifications"
              └── Toggle ON ✅
```

---

## Langkah Detail

### 1. Buka Project Supabase
- Login ke https://supabase.com
- Pilih project yang sudah dibuat

### 2. Masuk Menu Database
- Klik **"Database"** di sidebar kiri
- Akan muncul beberapa tab/submenu

### 3. Klik Tab "Replication"
- Ada di deretan tab: Tables | Replication | Backups | etc
- Jika **tidak ada tab Replication**, skip ke Metode SQL di bawah

### 4. Enable Table Notifications
- Scroll cari tabel **`notifications`**
- Ada toggle switch di sebelah nama tabel
- **Klik toggle** sampai jadi **hijau/ON**
- Klik **"Save"** atau auto-save

### 5. Verifikasi
- Cek apakah toggle masih ON setelah refresh page
- Status: **✅ Enabled**

---

## Metode SQL (Jika Menu Replication Tidak Ada)

Kadang project Supabase versi lama atau free tier tidak ada menu Replication. Pakai SQL ini:

### 1. Buka SQL Editor
- Dashboard > **SQL Editor**
- Klik **"+ New query"**

### 2. Jalankan Query Ini
```sql
-- Tambahkan tabel ke real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### 3. Jika Error "publication does not exist"
```sql
-- Buat publication dulu
CREATE PUBLICATION supabase_realtime;

-- Lalu tambahkan tabel
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### 4. Verifikasi Berhasil
```sql
-- Cek tabel yang sudah dienable real-time
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Expected Output:**
```
pubname           | schemaname | tablename
------------------|------------|-------------
supabase_realtime | public     | notifications
```

---

## Troubleshooting

### "Menu Replication tidak ada"
**Fix**: Pakai metode SQL di atas

### "ALTER PUBLICATION failed"
**Cause**: Publication `supabase_realtime` belum dibuat
**Fix**: 
```sql
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### "Table not found"
**Cause**: Tabel `notifications` belum dibuat
**Fix**: Jalankan dulu SQL dari `supabase_notifications_table.sql` bagian CREATE TABLE

### Real-time tidak jalan setelah enable
**Cek:**
1. Row Level Security (RLS) policy allow SELECT?
2. Flutter sudah subscribe ke channel yang benar?
3. Backend sudah insert data ke Supabase?
4. Lihat console log Flutter ada error?

---

## Test Real-time Berhasil

### Via Dashboard
1. Buka **Table Editor** > `notifications`
2. Klik **"Insert row"** (tambah data manual)
3. Isi data test:
   ```
   type: TEST
   title: Test Notification
   message: Testing real-time
   user_id: 1
   ```
4. **Save**
5. Jika Flutter app sudah listen → **notifikasi langsung muncul** 🎉

### Via Backend
1. Buat laporan baru via API
2. Cek console backend: `✅ Notifikasi tersimpan di Supabase`
3. Cek Flutter app: Notifikasi muncul real-time
4. Cek Supabase Dashboard > Table Editor: Data muncul

---

## Setelah Enable Real-time

Update `.env` backend (jika belum):
```env
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart backend:
```bash
npm run dev
```

Expected log:
```
✅ Supabase Client initialized
```

---

**Sudah enable real-time? Test dulu sebelum deploy! 🚀**
