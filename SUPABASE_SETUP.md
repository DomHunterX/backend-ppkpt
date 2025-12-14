# 🚀 Setup Supabase Real-time Notifications

## Langkah Setup

### 1. Buat Project Supabase
1. Login ke [https://supabase.com](https://supabase.com)
2. Create New Project
3. Tunggu project selesai dibuat (~2 menit)

---

### 2. Buat Tabel Notifications

1. Buka **Database** > **SQL Editor**
2. Copy-paste isi file `supabase_notifications_table.sql`
3. Klik **Run** untuk execute SQL
4. Tabel `notifications` akan otomatis dibuat

---

### 3. Enable Real-time

1. Buka **Database** > **Replication**
2. Cari tabel `notifications`
3. **Toggle ON** untuk enable real-time
4. Pastikan kolom yang di-replicate tercentang semua

---

### 4. Get Credentials

1. Buka **Settings** > **API**
2. Copy:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJxxx...`

---

### 5. Update Backend `.env`

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
```

---

### 6. Restart Backend Server

```bash
npm run dev
```

**Expected Log:**
```
✅ Supabase Client initialized
Database Connected Successfully
🚀 Server PPKPT berjalan dengan WebSocket di port 3000
```

---

### 7. Test Notifikasi

**Buat laporan baru:**
```bash
# Console log backend harus muncul:
💾 Notifikasi tersimpan di database untuk Laporan ID: 15
✅ Notifikasi tersimpan di Supabase (Real-time aktif)
```

**Cek Supabase Dashboard:**
1. Buka **Table Editor** > `notifications`
2. Data notifikasi harus muncul real-time

---

## Flutter Setup

### 1. Install Package

```yaml
dependencies:
  supabase_flutter: ^2.0.0
```

### 2. Initialize Supabase di Flutter

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://xxx.supabase.co',
    anonKey: 'eyJxxx...',
  );
  
  runApp(MyApp());
}
```

### 3. Listen Real-time Notifications

```dart
final supabase = Supabase.instance.client;

void listenToNotifications(String userId) {
  supabase
    .channel('user_notifications')
    .onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'notifications',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'user_id',
        value: userId,
      ),
      callback: (payload) {
        print('🔔 New notification: ${payload.newRecord}');
        // Show notification UI
      },
    )
    .subscribe();
}
```

---

## Testing Flow

1. **Backend**: Buat laporan baru via API
2. **Backend Log**: Notifikasi tersimpan di MySQL & Supabase
3. **Supabase Dashboard**: Data muncul di Table Editor
4. **Flutter**: Real-time listener otomatis dapat event INSERT
5. **Flutter UI**: Notifikasi muncul di app

---

## Troubleshooting

### Backend tidak connect ke Supabase
```
⚠️ Supabase tidak dikonfigurasi
```
**Fix**: Update `.env` dengan credentials Supabase yang benar

---

### Notifikasi tidak muncul di Flutter
**Cek:**
1. Real-time enabled di Supabase Dashboard?
2. RLS policy allow SELECT untuk user?
3. Filter `user_id` sesuai?
4. Console log Flutter ada error?

---

### Error "relation does not exist"
**Fix**: Jalankan SQL script `supabase_notifications_table.sql`

---

## Notes

- **MySQL**: Tetap dipakai untuk backup/riwayat notifikasi
- **Supabase**: Hanya untuk real-time delivery ke Flutter
- **WebSocket Backend**: Tetap jalan (untuk fallback/testing)
- **Dual System**: Lebih reliable (jika Supabase down, WebSocket masih jalan)

---

## Next Steps

- [ ] Setup Supabase project
- [ ] Create notifications table
- [ ] Enable real-time
- [ ] Update .env credentials
- [ ] Test backend notification insert
- [ ] Setup Flutter Supabase client
- [ ] Test real-time notification di Flutter
