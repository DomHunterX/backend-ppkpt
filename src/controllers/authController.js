const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
require('dotenv').config();

// Logika Register
const register = async (req, res) => {
    // Ambil data dari Body Request (yang dikirim dari Postman/Flutter)
    const { identity_number, full_name, password, phone_number, role } = req.body;

    // Validasi sederhana
    if (!identity_number || !password || !full_name) {
        return res.status(400).json({
            message: "Gagal: NIM/NIP, Nama, dan Password wajib diisi!"
        });
    }

    try {
        // Enkripsi Password (Hashing)
        // 10 (tingkat kerumitan enkripsi)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Siapkan data untuk model
        const newUser = {
            identity_number,
            full_name,
            password: hashedPassword, // Simpan yang sudah di-hash!
            phone_number,
            role // Opsional (default mahasiswa)
        };

        // Panggil Model
        await userModel.createNewUser(newUser);

        res.status(201).json({
            message: "Registrasi Berhasil! Silakan login.",
            data: { identity_number, full_name } // Jangan kembalikan password!
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
    const identity_number = (req.body.identity_number || '').trim();
    const password = req.body.password || '';

    if (!identity_number || !password) {
        return res.status(400).json({ message: "NIM/NIP dan Password wajib diisi." });
    }

    try {
        // Cari user berdasarkan identity_number
        const user = await userModel.findUserByIdentity(identity_number);

        if (!user) {
            return res.status(401).json({ message: "Identity tidak ditemukan." });
        }

        // Cek Password (bandingkan dengan hash di DB)
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah." });
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
            message: "Login Berhasil",
            token,
            user: {
                id: user.id,
                identity_number: user.identity_number,
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