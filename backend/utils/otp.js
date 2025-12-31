// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if OTP has expired
const isOtpExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

// Calculate OTP expiry time (5 minutes from now)
const getOtpExpiryTime = (minutes = 5) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now;
};

// Check cooldown period for resend (2 minutes)
const isResendCooldownActive = (lastRequestTime, cooldownMinutes = 2) => {
  if (!lastRequestTime) return false;

  const now = new Date();
  const lastRequest = new Date(lastRequestTime);
  const cooldownTime = new Date(lastRequest.getTime() + (cooldownMinutes * 60 * 1000));

  return now < cooldownTime;
};

// Get remaining cooldown time in minutes
const getRemainingCooldownTime = (lastRequestTime, cooldownMinutes = 2) => {
  if (!lastRequestTime) return 0;

  const now = new Date();
  const lastRequest = new Date(lastRequestTime);
  const cooldownTime = new Date(lastRequest.getTime() + (cooldownMinutes * 60 * 1000));

  const remainingMs = cooldownTime - now;
  return Math.ceil(remainingMs / (60 * 1000)); // Convert to minutes
};

// Validate OTP format (6 digits)
const isValidOtpFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

module.exports = {
  generateOTP,
  isOtpExpired,
  getOtpExpiryTime,
  isResendCooldownActive,
  getRemainingCooldownTime,
  isValidOtpFormat
};
