# ✅ Supabase Integration - DONE

## Yang Sudah Dibuat

### 📦 Package Installed
- ✅ `@supabase/supabase-js` (v2.x)

### 📁 File Baru
1. **`src/config/supabase.js`** - Konfigurasi Supabase client
2. **`supabase_notifications_table.sql`** - SQL script untuk buat tabel di Supabase
3. **`SUPABASE_SETUP.md`** - Tutorial lengkap setup Supabase

### 🔄 File Diupdate
1. **`.env`** - Tambah SUPABASE_URL & SUPABASE_ANON_KEY
2. **`src/models/notificationModel.js`** - Auto insert ke Supabase setelah MySQL
3. **`src/controllers/laporanController.js`** - Kirim user_id untuk filter
4. **`FLUTTER_NOTIFICATION_PROMPT.md`** - Update dokumentasi Flutter

---

## Cara Pakai

### 1. Setup Supabase (Pertama Kali)
```bash
# Ikuti panduan di SUPABASE_SETUP.md
1. Buat project Supabase
2. Jalankan SQL script supabase_notifications_table.sql
3. Enable real-time di Dashboard
4. Copy credentials (URL + anon key)
5. Update .env
```

### 2. Update `.env`
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
```

### 3. Test Backend
```bash
npm run dev
```

**Expected Log:**
```
✅ Supabase Client initialized
💾 Notifikasi tersimpan di database untuk Laporan ID: X
✅ Notifikasi tersimpan di Supabase (Real-time aktif)
```

---

## Arsitektur Sistem

```
User buat laporan
    ↓
Backend (laporanController.js)
    ↓
┌─────────────────┬─────────────────┐
│   MySQL (Local) │ Supabase (Cloud)│
│   - Backup      │ - Real-time     │
│   - Riwayat     │ - Flutter       │
└─────────────────┴─────────────────┘
    ↓                   ↓
WebSocket (Fallback)  Supabase Real-time
    ↓                   ↓
┌──────────────────────────────────┐
│      Flutter App                 │
│  - Supabase listener (primary)   │
│  - WebSocket (fallback/optional) │
└──────────────────────────────────┘
```

---

## Keuntungan Dual System

1. **MySQL (Local)**
   - ✅ Backup permanent
   - ✅ Riwayat lengkap
   - ✅ Query kompleks
   - ✅ Independent dari cloud

2. **Supabase (Cloud)**
   - ✅ Real-time otomatis
   - ✅ Filter per user
   - ✅ Row Level Security
   - ✅ Package Flutter mature

3. **WebSocket (Fallback)**
   - ✅ Tetap jalan jika Supabase down
   - ✅ Testing lokal tanpa internet
   - ✅ Room-based targeting

---

## Next Steps

### Backend ✅ (DONE)
- [x] Install @supabase/supabase-js
- [x] Buat config/supabase.js
- [x] Update notificationModel.js
- [x] Update laporanController.js
- [x] Tambah user_id ke notification

### Supabase Setup ⏳ (TODO)
- [ ] Buat project Supabase
- [ ] Jalankan SQL script
- [ ] Enable real-time
- [ ] Copy credentials
- [ ] Update .env production

### Flutter Setup ⏳ (TODO)
- [ ] Install supabase_flutter
- [ ] Initialize Supabase client
- [ ] Implement real-time listener
- [ ] Test notifikasi

---

## Files Ready to Push

```
✅ src/config/supabase.js
✅ src/models/notificationModel.js (updated)
✅ src/controllers/laporanController.js (updated)
✅ .env (updated - jangan push!)
✅ supabase_notifications_table.sql
✅ SUPABASE_SETUP.md
✅ FLUTTER_NOTIFICATION_PROMPT.md (updated)
✅ package.json (updated)
```

---

## Warning

⚠️ **JANGAN PUSH `.env` KE GITHUB!**

Pastikan `.env` ada di `.gitignore`:
```
.env
```

Untuk production, set environment variable di VPS:
```bash
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJxxx..."
```

---

## Testing Command

```bash
# Test create laporan
curl -X POST http://localhost:3000/api/laporan \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test","nomor_telepon":"08123","domisili":"Test","jenis_kekerasan":"Kekerasan Fisik","cerita_peristiwa":"Test",...}'

# Expected:
# - Console: ✅ Notifikasi tersimpan di Supabase
# - Supabase Dashboard: Data muncul di tabel notifications
# - Flutter (jika connected): Real-time notification
```

---

**Status**: ✅ Setup complete, siap push ke GitHub!
