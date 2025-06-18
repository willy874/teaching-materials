const express = require('express');
const { register, login, logout, refreshToken } = require('../controllers/authController');
const { forgotPassword, resetPassword, changePassword } = require('../controllers/passwordController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;