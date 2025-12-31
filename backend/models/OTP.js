const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  hashedOtp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - MongoDB will automatically delete expired documents
  },
  verificationAttempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['signup', 'password_reset', 'email_change'],
    default: 'signup'
  },
  lastAttemptAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash OTP before saving
// Hash OTP before saving
otpSchema.pre('save', async function () {
  if (!this.isModified('hashedOtp') || this.hashedOtp.startsWith('$2')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.hashedOtp = await bcrypt.hash(this.hashedOtp, salt);
});

// Compare OTP method
otpSchema.methods.compareOtp = async function (candidateOtp) {
  return await bcrypt.compare(candidateOtp, this.hashedOtp);
};

// Increment verification attempts
otpSchema.methods.incrementAttempts = function () {
  this.verificationAttempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Mark OTP as used
otpSchema.methods.markAsUsed = function () {
  this.isUsed = true;
  return this.save();
};

// Check if OTP is expired
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Check if max attempts reached
otpSchema.methods.isMaxAttemptsReached = function () {
  return this.verificationAttempts >= 3;
};

module.exports = mongoose.model('OTP', otpSchema);
