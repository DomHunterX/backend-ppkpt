const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
require('dotenv').config();

// Logika Register
const register = async (req, res) => {
    // Ambil data dari Body Request (yang dikirim dari Postman/Flutter)
    const { identity_number, tahun_masuk, kode_jurusan, username, full_name, password, phone_number, role } = req.body;

    // Validasi sederhana
    if (!password || !full_name) {
        return res.status(400).json({
            message: "Gagal: Nama dan Password wajib diisi!"
        });
    }

    try {
        let finalIdentityNumber = identity_number;
        
        // Auto-generate NPM untuk mahasiswa jika tidak diinput manual
        if ((!identity_number || identity_number.trim() === '') && (role === 'mahasiswa' || !role)) {
            // Validasi tahun_masuk dan kode_jurusan untuk generate NPM
            if (!tahun_masuk || !kode_jurusan) {
                return res.status(400).json({
                    message: "Gagal: Tahun Masuk dan Kode Jurusan wajib diisi untuk generate NPM mahasiswa!"
                });
            }
            
            // Generate NPM otomatis
            finalIdentityNumber = await userModel.generateNPM(tahun_masuk, kode_jurusan);
            console.log(`✅ NPM auto-generated: ${finalIdentityNumber}`);
        } else if (!identity_number || identity_number.trim() === '') {
            // Untuk role selain mahasiswa, identity_number wajib diisi manual
            return res.status(400).json({
                message: "Gagal: NIM/NIP wajib diisi untuk role selain mahasiswa!"
            });
        }

        // Enkripsi Password (Hashing)
        // 10 (tingkat kerumitan enkripsi)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Siapkan data untuk model
        const newUser = {
            identity_number: finalIdentityNumber,
            username, // Opsional: username untuk login alternatif
            full_name,
            password: hashedPassword, // Simpan yang sudah di-hash!
            phone_number,
            role // Opsional (default mahasiswa)
        };

        // Panggil Model
        await userModel.createNewUser(newUser);

        res.status(201).json({
            message: "Registrasi Berhasil! Silakan login.",
            data: { 
                identity_number: finalIdentityNumber, 
                npm: finalIdentityNumber, // Alias untuk mahasiswa
                username: username || null,
                full_name 
            } // Jangan kembalikan password!
        });

    } catch (error) {
        // Cek error duplicate entry (Jika NPM sudah terdaftar)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "NPM ini sudah terdaftar." });
        }
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Logika Login
const login = async (req, res) => {
    // Validasi input dasar + trimming
    // Terima dari field 'username' atau 'identity_number'
    const loginInput = (req.body.username || req.body.identity_number || '').trim();
    const password = req.body.password || '';

    if (!loginInput || !password) {
        return res.status(400).json({ message: "Username/NIM/NIP dan Password wajib diisi." });
    }

    try {
        // Cari user berdasarkan identity_number ATAU username
        const user = await userModel.findUserByIdentity(loginInput);

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: "Username atau NIM tidak ditemukan.",
                error_code: "USER_NOT_FOUND"
            });
        }

        // Cek Password (bandingkan dengan hash di DB)
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Password yang Anda masukkan salah.",
                error_code: "WRONG_PASSWORD"
            });
        }

        // Guard untuk secret JWT
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: "Konfigurasi JWT_SECRET tidak ditemukan." });
        }

        // Buat Token JWT berisi id, role, dan identity_number
        const token = jwt.sign(
            { id: user.id, role: user.role || 'mahasiswa', identity_number: user.identity_number },
            secret,
            { expiresIn: '7d' }
        );

        // Bentuk payload user yang konsisten dengan tabel (opsional field jika tidak ada di DB dump)
        res.json({
            success: true,
            message: "Login Berhasil",
            token,
            user: {
                id: user.id,
                identity_number: user.identity_number,
                username: user.username || null,
                full_name: user.full_name || null,
                phone_number: user.phone_number || null,
                role: user.role || 'mahasiswa'
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { register, login };