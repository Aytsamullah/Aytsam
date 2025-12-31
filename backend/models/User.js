const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  cnic: {
    type: String,
    required: [true, 'CNIC is required'],
    unique: true,
    validate: {
      validator: function (v) {
        // Pakistani CNIC format: 12345-1234567-1
        return /^\d{5}-\d{7}-\d{1}$/.test(v);
      },
      message: 'Please enter a valid CNIC format (XXXXX-XXXXXXX-X)'
    }
  },
  name: {
    type: String,
    required: [true, 'Full Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  lastOtpRequest: {
    type: Date,
    default: null
  },
  otpRequestCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Reset OTP request tracking
userSchema.methods.resetOtpTracking = function () {
  this.lastOtpRequest = null;
  this.otpRequestCount = 0;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
