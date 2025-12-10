const { db } = require('../config/database');

// GET /api/me
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

module.exports = { me };
