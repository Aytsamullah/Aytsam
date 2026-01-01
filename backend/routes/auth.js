const express = require('express');
const router = express.Router();

const {
  signup,
  verifyOtp,
  resendOtp,
  getProfile,
  login,
  getAllPatients,
  addTreatment,
  deleteTreatment
} = require('../controllers/authController');

const {
  validateSignup,
  validateOtpVerification,
  validateResendOtp,
  handleValidationErrors
} = require('../middleware/validation');

const { protect } = require('../middleware/auth');

const {
  authLimiter,
  otpRequestLimiter,
  otpVerificationLimiter,
  resendOtpLimiter
} = require('../middleware/rateLimit');

// Public routes (with rate limiting)
// Spread validator arrays to ensure proper middleware execution
router.post('/signup', authLimiter, ...validateSignup, handleValidationErrors, signup);
router.post('/verify-otp', otpVerificationLimiter, ...validateOtpVerification, handleValidationErrors, verifyOtp);
router.post('/resend-otp', resendOtpLimiter, ...validateResendOtp, handleValidationErrors, resendOtp);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/profile', protect, getProfile);
router.get('/patients', protect, getAllPatients);
router.post('/treatments', protect, addTreatment);
router.delete('/treatments/:id', protect, deleteTreatment);

module.exports = router;
