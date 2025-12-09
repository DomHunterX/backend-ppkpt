# 🛡️ Backend API - Sistem Pelaporan PPKPT Polinela

> **Repository Backend** untuk aplikasi pencegahan dan penanganan kekerasan seksual & perundungan di lingkungan Politeknik Negeri Lampung.

---

## 🛠️ Teknologi yang Digunakan
* **Runtime:** Node.js (JavaScript)
* **Framework:** Express.js
* **Database:** MySQL
* **Keamanan:** JSON Web Token (JWT) & Bcrypt (Hashing Password)
* **Arsitektur:** MVC (Model-View-Controller)

---

## 🚀 Cara Instalasi (Setup Guide)

Ikuti langkah-langkah ini agar backend berjalan.

### 1. Prasyarat
Pastikan laptop sudah terinstall:
* [Node.js](https://nodejs.org/) (Minimal versi 16 ke atas)
* XAMPP (Untuk database MySQL)
* [Postman](https://www.postman.com/) atau Extension VSCode **Thunder Client**

### 2. Install Dependencies
Buka terminal di dalam folder proyek, lalu jalankan:
```bash
npm install

### 3. Setup Database

USE db_ppkpt_polinela;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identity_number VARCHAR(20) NOT NULL UNIQUE, 
    full_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('mahasiswa', 'dosen', 'tenaga_kependidikan', 'satgas', 'admin') DEFAULT 'mahasiswa',
    phone_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

### 4. Konfigurasi Environment (.env)
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=db_ppkpt_polinela
JWT_SECRET=owi_ppkpt_2025

### 5. Menjalankan Server
npm run dev

Jika berhasil, terminal akan menampilkan: Server PPKPT berjalan di port 3000 Database Connected Successfully

### 6. Dokumentasi API (Endpoints)
* **Base URL:** http://localhost:3000
* **API Login:** /api/auth/login
* **API Register:** /api/auth/register

---

⚠️ Catatan untuk Frontend (Flutter): Simpan token ini di Secure Storage atau Shared Preferences. Token ini wajib dikirim di Header untuk request selanjutnya.

---

📂 Struktur Folder
│
├── /src
│   ├── /config         # Koneksi Database & Library Config
│   ├── /controllers    # Logika bisnis (Validasi input, panggil model)
│   ├── /models         # Query Database (SQL)
│   ├── /routes         # Definisi URL API
│   └── /middleware     # Keamanan (Cek Token JWT)
│
├── .env                # Variabel sensitif (Password DB, Secret Key)
├── app.js              # Entry point aplikasi
└── package.json        # Daftar library