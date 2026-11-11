const crypto = require('crypto');
const Otp = require('../models/Otp');
const {
  sendEmail,
  getEmailVerificationTemplate,
  getLoginOtpTemplate,
  getPasswordResetOtpTemplate,
} = require('./email');

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit numeric OTP string
 */
const generate6DigitOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash an OTP using SHA-256
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

/**
 * Generate and dispatch an OTP for email_verification, login_verification, or password_reset
 */
exports.createAndSendOtp = async ({ email, name, purpose, resend = false }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check resend cooldown (rate limit across both used and pending OTPs)
  const latestOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose,
  }).sort({ createdAt: -1 });

  if (latestOtp) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(latestOtp.lastSentAt).getTime()) / 1000);
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitRemaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      const error = new Error(`Please wait ${waitRemaining} seconds before requesting a new code.`);
      error.statusCode = 429;
      error.cooldownRemaining = waitRemaining;
      throw error;
    }
  }

  // Invalidate any older unused OTPs for this email and purpose
  await Otp.updateMany(
    { email: normalizedEmail, purpose, isUsed: false },
    { $set: { isUsed: true } }
  );

  // Generate new OTP
  const rawOtp = generate6DigitOtp();
  const otpHash = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store hashed OTP in database
  await Otp.create({
    email: normalizedEmail,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    lastSentAt: new Date(),
    isUsed: false,
  });

  // Prepare email template based on purpose
  let emailData;
  if (purpose === 'email_verification') {
    emailData = getEmailVerificationTemplate(name, rawOtp, OTP_EXPIRY_MINUTES);
  } else if (purpose === 'login_verification') {
    emailData = getLoginOtpTemplate(name, rawOtp, OTP_EXPIRY_MINUTES);
  } else if (purpose === 'password_reset') {
    emailData = getPasswordResetOtpTemplate(name, rawOtp, OTP_EXPIRY_MINUTES);
  } else {
    throw new Error(`Unsupported OTP purpose: ${purpose}`);
  }

  // Dispatch email asynchronously in background so HTTP response is instant (<100ms)
  sendEmail({
    to: normalizedEmail,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
  }).catch((err) => {
    console.error(`[BACKGROUND EMAIL FAILED to ${normalizedEmail}]:`, err.message);
  });

  return {
    success: true,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  };
};

/**
 * Verify an entered OTP against database record
 */
exports.verifyOtp = async ({ email, otp, purpose }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const enteredOtp = String(otp || '').trim();

  if (!enteredOtp || enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
    return { valid: false, message: 'Please enter a valid 6-digit numeric verification code.' };
  }

  // Find active, unused OTP matching email and purpose
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return { valid: false, message: 'No active verification code found. Please request a new code.' };
  }

  // Check expiration
  if (new Date() > new Date(otpRecord.expiresAt)) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    return { valid: false, message: 'Verification code has expired. Please request a new code.' };
  }

  // Check attempt limit
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    return {
      valid: false,
      message: 'Too many incorrect attempts. This code has been invalidated for security. Please request a new code.',
    };
  }

  // Verify hash
  const candidateHash = hashOtp(enteredOtp);
  if (candidateHash !== otpRecord.otpHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = otpRecord.maxAttempts - otpRecord.attempts;
    return {
      valid: false,
      message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Success: mark as used to prevent replay attacks
  otpRecord.isUsed = true;
  await otpRecord.save();

  return { valid: true, message: 'Verification successful.' };
};
