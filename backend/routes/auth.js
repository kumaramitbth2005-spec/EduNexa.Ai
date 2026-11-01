const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmailOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
];

const verifyEmailOtpValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit verification code required'),
  validate,
];

const verifyLoginOtpValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit verification code required'),
  validate,
];

router.post('/register', registerValidation, register);
router.post('/verify-email-otp', verifyEmailOtpValidation, verifyEmailOtp);
router.post('/login', loginValidation, login);
router.post('/verify-login-otp', verifyLoginOtpValidation, verifyLoginOtp);
router.post('/resend-otp', body('email').isEmail(), validate, resendOtp);
router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
router.post('/reset-password', body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 }), body('password').isLength({ min: 8 }), validate, resetPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
