const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'JWT secret missing' });

    const payload = jwt.verify(token, secret);

    // Load user basic info
    const [rows] = await db.execute('SELECT id, identity_number, role FROM users WHERE id = ? LIMIT 1', [payload.id]);
    if (!rows.length) return res.status(401).json({ message: 'User not found' });

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
