const User = require('../models/User');
const OTP = require('../models/OTP');
const Treatment = require('../models/Treatment');
const { sendOtpEmail } = require('../services/emailService');
const { generateToken } = require('../utils/jwt');
const {
  generateOTP,
  getOtpExpiryTime,
  isResendCooldownActive,
  getRemainingCooldownTime
} = require('../utils/otp');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register user and send OTP
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res, next) => {
  const { cnic, email, password, name } = req.body;

  // Check if user already exists
  const existingUsers = await User.find({
    $or: [{ email: email.toLowerCase() }, { cnic }]
  });

  // Check if any matching user is already verified
  for (const existingUser of existingUsers) {
    if (existingUser.isVerified) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      if (existingUser.cnic === cnic) {
        return res.status(400).json({
          success: false,
          message: 'User with this CNIC already exists'
        });
      }
    }
  }

  // If we reach here, any existing users are unverified.
  // We can safely delete them to allow a fresh signup
  if (existingUsers.length > 0) {
    const idsToDelete = existingUsers.map(u => u._id);
    await User.deleteMany({ _id: { $in: idsToDelete } });
    await OTP.deleteMany({ userId: { $in: idsToDelete } });
  }

  // Create user (not verified yet)
  const user = await User.create({
    cnic,
    name: name || cnic, // Use provided name or fallback to CNIC
    email: email.toLowerCase(),
    password,
    role: (req.body.role || 'patient').toLowerCase()
  });

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = getOtpExpiryTime(5); // 5 minutes

  // Delete any existing OTP for this user
  await OTP.deleteMany({ userId: user._id, type: 'signup' });

  // Create new OTP record
  const otpRecord = await OTP.create({
    userId: user._id,
    email: user.email,
    hashedOtp: otp, // Will be hashed by pre-save middleware
    expiresAt,
    type: 'signup'
  });

  // Update user's OTP tracking
  user.lastOtpRequest = new Date();
  user.otpRequestCount += 1;
  await user.save();

  // Send OTP email
  // Send OTP email (development mode: show in console)
  // Send OTP email
  try {
    await sendOtpEmail(user.email, otp, 'signup');
  } catch (emailError) {
    console.error('Email sending failed:', emailError);

    // In development, still log the OTP but also return error to frontend so user knows email failed
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEVELOPMENT MODE] OTP for ${user.email}: ${otp} `);
    }

    // Delete the user since signup failed (transaction-like behavior)
    await User.findByIdAndDelete(user._id);
    await OTP.deleteMany({ userId: user._id });

    // Return the specific error message to help debugging (e.g. "Invalid login", "ETIMEDOUT")
    return next(new AppError(`Email Error: ${emailError.message}. Check EMAIL_USER and EMAIL_PASS (App Password).`, 500));
  }

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please check your email for verification code.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        cnic: user.cnic,
        isVerified: user.isVerified
      }
    }
  });
});

// @desc    Verify OTP and activate account
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Account is already verified'
    });
  }

  // Find valid OTP record
  const otpRecord = await OTP.findOne({
    userId: user._id,
    email: email.toLowerCase(),
    type: 'signup',
    isUsed: false
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: 'No valid verification code found. Please request a new one.'
    });
  }

  // Check if OTP has expired
  if (otpRecord.isExpired()) {
    return res.status(400).json({
      success: false,
      message: 'Verification code has expired. Please request a new one.'
    });
  }

  // Check if max attempts reached
  if (otpRecord.isMaxAttemptsReached()) {
    return res.status(429).json({
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new code.'
    });
  }

  // Increment attempts
  await otpRecord.incrementAttempts();

  // Verify OTP
  const isValidOtp = await otpRecord.compareOtp(otp);
  if (!isValidOtp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code',
      attemptsRemaining: 3 - otpRecord.verificationAttempts
    });
  }

  // Mark OTP as used
  await otpRecord.markAsUsed();

  // Activate user account
  user.isVerified = true;
  // Manually reset OTP tracking to avoid double-save reference error
  // (resetOtpTracking helper method calls save(), causing parallel save error)
  user.lastOtpRequest = null;
  user.otpRequestCount = 0;
  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Account verified successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        cnic: user.cnic,
        isVerified: user.isVerified,
        role: user.role
      }
    },
    token
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Account is already verified'
    });
  }

  // Check cooldown period
  if (isResendCooldownActive(user.lastOtpRequest)) {
    const remainingTime = getRemainingCooldownTime(user.lastOtpRequest);
    return res.status(429).json({
      success: false,
      message: `Please wait ${remainingTime} minutes before requesting another code`
    });
  }

  // Check daily request limit (optional - you can adjust this)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyRequests = await OTP.countDocuments({
    userId: user._id,
    type: 'signup',
    createdAt: { $gte: today }
  });

  if (dailyRequests >= 10) { // Max 10 requests per day
    return res.status(429).json({
      success: false,
      message: 'Daily OTP request limit exceeded. Please try again tomorrow.'
    });
  }

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = getOtpExpiryTime(5);

  // Delete existing unused OTPs for this user
  await OTP.deleteMany({
    userId: user._id,
    type: 'signup',
    isUsed: false
  });

  // Create new OTP record
  await OTP.create({
    userId: user._id,
    email: user.email,
    hashedOtp: otp,
    expiresAt,
    type: 'signup'
  });

  // Update user's OTP tracking
  user.lastOtpRequest = new Date();
  user.otpRequestCount += 1;
  await user.save();

  // Send OTP email
  try {
    await sendOtpEmail(user.email, otp, 'signup');
  } catch (emailError) {
    console.error('Email resend failed:', emailError);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'New verification code sent to your email'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');

  let profileData = { user };

  // If user is a patient, fetch their treatments
  if (user.role === 'patient') {
    const treatments = await Treatment.find({ patientId: user._id }).sort({ timestamp: -1 });

    // Map to match the structure expected by frontend PatientProfile
    profileData.user = {
      ...user.toObject(),
      treatments: treatments.map(t => ({
        id: t._id,
        patientId: t.patientId,
        doctorId: t.doctorId,
        doctorName: t.doctorName,
        diagnosis: t.diagnosis,
        medication: t.medication,
        notes: t.notes,
        files: t.files,
        timestamp: t.timestamp
      })),
      medicalHistory: [] // Placeholder as per schema
    };
  }

  res.status(200).json({
    success: true,
    data: profileData
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is verified
  if (!user.isVerified) {
    return res.status(401).json({
      success: false,
      message: 'Account not verified. Please verify your email first.'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Verify Role (New Requirement)
  const { role } = req.body;
  if (role && user.role !== role.toLowerCase()) {
    return res.status(401).json({
      success: false,
      message: `Access denied.This account is registered as a ${user.role}, but you are trying to login as a ${role}.`
    });
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        cnic: user.cnic,
        isVerified: user.isVerified,
        role: user.role
      },
      token
    }
  });
});

// @desc    Get all patients (for doctors)
// @route   GET /api/auth/patients
// @access  Private (Doctor only)
const getAllPatients = asyncHandler(async (req, res, next) => {
  const patients = await User.find({ role: 'patient' })
    .select('-password -__v')
    .sort({ createdAt: -1 });

  // Fetch treatments for all patients
  const patientData = await Promise.all(patients.map(async (p) => {
    const treatments = await Treatment.find({ patientId: p._id }).sort({ timestamp: -1 });

    return {
      id: p._id,
      role: p.role,
      name: p.name || p.cnic, // Prefer name, fallback to CNIC
      email: p.email,
      cnic: p.cnic,
      medicalHistory: [], // Placeholder
      treatments: treatments.map(t => ({
        id: t._id,
        patientId: t.patientId,
        doctorId: t.doctorId,
        doctorName: t.doctorName,
        diagnosis: t.diagnosis,
        medication: t.medication,
        notes: t.notes,
        files: t.files,
        timestamp: t.timestamp
      }))
    };
  }));

  res.status(200).json({
    success: true,
    data: {
      patients: patientData
    }
  });
});



// @desc    Add a new treatment record
// @route   POST /api/auth/treatments
// @access  Private (Doctor only)
const addTreatment = asyncHandler(async (req, res, next) => {
  const { patientId, diagnosis, medication, notes, files } = req.body;

  // Verify doctor role (double check)
  if (req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Only doctors can add treatment records'
    });
  }

  const treatment = await Treatment.create({
    patientId,
    doctorId: req.user._id,
    doctorName: req.user.name || req.user.cnic, // Use doctor's name
    diagnosis,
    medication,
    notes,
    files: files || []
  });

  res.status(201).json({
    success: true,
    data: {
      treatment
    }
  });
});

// @desc    Delete a treatment record
// @route   DELETE /api/auth/treatments/:id
// @access  Private (Patient only)
const deleteTreatment = asyncHandler(async (req, res, next) => {
  const treatmentId = req.params.id;

  // Find the treatment
  const treatment = await Treatment.findById(treatmentId);

  if (!treatment) {
    return res.status(404).json({
      success: false,
      message: 'Treatment record not found'
    });
  }

  // Ensure only the patient who owns the record can delete it
  // (Or potentially a doctor, but requirements say "patient deletes")
  if (req.user.role !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Only patients can delete their own records'
    });
  }

  if (treatment.patientId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to delete this record'
    });
  }

  await treatment.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Treatment record deleted successfully'
  });
});

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  getProfile,
  login,
  getAllPatients,
  addTreatment,
  deleteTreatment
};
