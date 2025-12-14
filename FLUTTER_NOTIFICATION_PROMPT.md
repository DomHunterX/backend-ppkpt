# 📱 Flutter: Notifikasi dengan Supabase Real-time

## Backend API Base URL
```
http://31.97.109.108:3000
```

---

## REST API Endpoints (Tetap dipakai untuk riwayat)

### 1. Get All Notifications
```http
GET /api/notifications
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Berhasil mengambil data notifikasi",
  "total": 5,
  "data": [
    {
      "notification_id": 1,
      "type": "LAPORAN_BARU",
      "title": "Laporan Dalam Diproses",
      "message": "Laporan telah diterima dan menunggu verifikasi. Kode: LP-000014KV",
      "ref_id": 14,
      "ref_type": "LAPORAN",
      "created_at": "2025-12-14T10:30:00.000Z",
      "formatted_date": "14 Des 2025 10:30"
    }
  ]
}
```

---

### 2. Get Notifications by Laporan ID
```http
GET /api/notifications/laporan/:laporan_id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/notifications/laporan/14
```

**Response:**
```json
{
  "message": "Berhasil mengambil notifikasi laporan",
  "laporan_id": 14,
  "total": 2,
  "data": [
    {
      "notification_id": 2,
      "type": "STATUS_LAPORAN",
      "title": "Status Laporan Diperbarui",
      "message": "Laporan Kekerasan Fisik Anda kini berstatus: Sedang Ditinjau. Kode: LP-000014KV",
      "ref_id": 14,
      "ref_type": "LAPORAN",
      "created_at": "2025-12-14T11:00:00.000Z",
      "formatted_date": "14 Des 2025 11:00"
    }
  ]
}
```

---

## Supabase Real-time (Untuk notifikasi instan)

### Package yang Dibutuhkan

```yaml
dependencies:
  supabase_flutter: ^2.0.0
  http: ^1.2.0
```

---

### Setup Supabase

1. **Buat tabel `notifications` di Supabase** (mirror dari MySQL)
2. **Enable Real-time** di Supabase Dashboard untuk tabel `notifications`
3. **Setup Row Level Security (RLS)** agar user hanya bisa lihat notifikasi mereka

---

### Implementasi Real-time Listener

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

// Listen to new notifications (INSERT event)
void listenToNotifications(String userId) {
  supabase
    .channel('notifications')
    .onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'notifications',
      callback: (payload) {
        print('New notification: ${payload.newRecord}');
        
        // Show notification
        _showNotification(payload.newRecord);
      },
    )
    .subscribe();
}

void _showNotification(Map<String, dynamic> data) {
  // Tampilkan SnackBar/Dialog/Push Notification
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text('${data['title']}: ${data['message']}'),
      duration: Duration(seconds: 5),
    ),
  );
}

// Unsubscribe saat logout
void dispose() {
  supabase.removeAllChannels();
}
```

---

### Filter Notifikasi Berdasarkan User

```dart
// Jika ingin filter notifikasi per user (butuh kolom user_id di tabel notifications)
void listenToUserNotifications(String userId) {
  supabase
    .channel('user_notifications_$userId')
    .onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'notifications',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'user_id', // Perlu tambah kolom ini di tabel notifications
        value: userId,
      ),
      callback: (payload) {
        _showNotification(payload.newRecord);
      },
    )
    .subscribe();
}
```

---

## Arsitektur Hybrid (Backend + Supabase)

### Backend (Node.js)
- ✅ Simpan notifikasi ke MySQL (untuk riwayat/backup)
- ✅ Simpan notifikasi ke Supabase (untuk real-time)

### Flutter
- ✅ Supabase Real-time: Untuk notifikasi instan
- ✅ REST API Backend: Untuk load riwayat notifikasi lengkap

---

## Flow Notifikasi

```
1. User buat laporan
   ↓
2. Backend Node.js:
   - Simpan ke MySQL ✅
   - Simpan ke Supabase ✅
   ↓
3. Supabase Real-time:
   - Trigger INSERT event
   - Flutter listener otomatis dapat notifikasi ⚡
   ↓
4. Tampilkan notifikasi di Flutter UI
```

---

## Catatan Backend (Perlu Update)

**Tambahkan Supabase client di Backend:**

```javascript
// Install: npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Di laporanController.js, setelah simpan ke MySQL:
async function saveNotificationToSupabase(data) {
  const { error } = await supabase
    .from('notifications')
    .insert([data]);
  
  if (error) console.error('Supabase insert error:', error);
}
```
