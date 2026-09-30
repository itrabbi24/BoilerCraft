const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { auth, role } = require('../middlewares/auth');

// Public
router.post('/register', register);
router.post('/login', login);

// Protected Routes
router.get('/profile', auth, getProfile);
router.get('/admin', auth, role('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome to Admin Authorized Area!', user: req.user });
});

module.exports = router;
