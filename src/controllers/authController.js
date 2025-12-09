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
    const { identity_number, password } = req.body;

    try {
        // Cari user berdasarkan NIM
        const user = await userModel.findUserByIdentity(identity_number);

        // Jika user tidak ditemukan
        if (!user) {
            return res.status(401).json({ message: "Login Gagal: NPM tidak ditemukan." });
        }

        // Cek Password (Bandingkan input user dengan Hash di DB)
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Login Gagal: Password salah." });
        }

        // Jika Sukses, Buat Token JWT
        // Token ini berisi ID dan Role user
        const token = jwt.sign(
            { id: user.id, role: user.role, identity: user.identity_number }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } // Token berlaku 7 hari (biar user tidak login terus-terusan)
        );

        res.json({
            message: "Login Berhasil",
            token: token, // Ini yang akan disimpan di HP User
            user: {
                id: user.id,
                name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { register, login };