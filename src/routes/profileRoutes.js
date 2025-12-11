const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// GET /api/me - Get user profile
router.get('/me', auth, profileController.me);

// PUT /api/profile - Update profile mahasiswa
router.put('/profile', auth, profileController.updateProfile);

module.exports = router;
