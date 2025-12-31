const { validationResult, body, param } = require('express-validator');

// Handle validation errors - MUST be a proper middleware function
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join(', '),
      errors: errors.array(),
    });
  }
  next();
};

// Signup validation - ensure each validator is properly chained
const validateSignup = [
  body('cnic')
    .trim()
    .notEmpty()
    .withMessage('CNIC is required')
    .matches(/^\d{5}-\d{7}-\d{1}$/)
    .withMessage('CNIC must be in format XXXXX-XXXXXXX-X'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// OTP verification validation
const validateOtpVerification = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
];

// Resend OTP validation
const validateResendOtp = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

// Email parameter validation
const validateEmailParam = [
  param('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

module.exports = {
  validateSignup,
  validateOtpVerification,
  validateResendOtp,
  validateEmailParam,
  handleValidationErrors
};