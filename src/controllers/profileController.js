const { db } = require('../config/database');

// GET /api/me - Get user profile
const me = async (req, res) => {
  try {
    const user = req.user; // from auth middleware

    let profile = null;
    if (user.role === 'mahasiswa') {
      const [rows] = await db.execute(
        'SELECT nim, full_name, jurusan, phone_number FROM mahasiswa WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      profile = rows.length ? rows[0] : null;
    }

    return res.json({
      user: {
        id: user.id,
        identity_number: user.identity_number,
        role: user.role,
      },
      profile
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// PUT /api/profile - Update profile mahasiswa
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    
    // Hanya mahasiswa yang bisa update profile
    if (user.role !== 'mahasiswa') {
      return res.status(403).json({ 
        message: 'Akses ditolak. Hanya mahasiswa yang dapat mengupdate profile.' 
      });
    }

    const { nim, full_name, jurusan, phone_number } = req.body;

    // Validasi input
    if (!nim || !full_name || !jurusan || !phone_number) {
      return res.status(400).json({ 
        message: 'Semua field wajib diisi (NIM, Nama Lengkap, Jurusan, Nomor Telepon)' 
      });
    }

    // Validasi NIM tidak boleh kosong dan trim whitespace
    const trimmedNim = nim.trim();
    if (trimmedNim.length === 0) {
      return res.status(400).json({ 
        message: 'NIM tidak boleh kosong' 
      });
    }

    // Validasi phone number (harus angka dan minimal 10 digit)
    if (!/^\d{10,15}$/.test(phone_number)) {
      return res.status(400).json({ 
        message: 'Nomor telepon harus berupa angka (10-15 digit)' 
      });
    }

    // Cek apakah data mahasiswa sudah ada
    const [existingData] = await db.execute(
      'SELECT id FROM mahasiswa WHERE user_id = ? LIMIT 1',
      [user.id]
    );

    if (existingData.length === 0) {
      return res.status(404).json({ 
        message: 'Data mahasiswa tidak ditemukan' 
      });
    }

    const mahasiswa_id = existingData[0].id;

    // Update data mahasiswa
    await db.execute(
      `UPDATE mahasiswa 
       SET nim = ?, full_name = ?, jurusan = ?, phone_number = ? 
       WHERE id = ?`,
      [nim, full_name, jurusan, phone_number, mahasiswa_id]
    );

    // Ambil data terbaru
    const [updatedData] = await db.execute(
      'SELECT nim, full_name, jurusan, phone_number FROM mahasiswa WHERE id = ? LIMIT 1',
      [mahasiswa_id]
    );

    return res.json({
      message: 'Profile berhasil diperbarui',
      profile: updatedData[0]
    });

  } catch (err) {
    console.error('Error updateProfile:', err);
    return res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
};

module.exports = { me, updateProfile };
