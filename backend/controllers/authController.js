const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAndSendOtp, verifyOtp } = require('../utils/otpHelper');

const signToken = (id) =>
  jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.emailVerifyToken;
  delete userObj.emailVerifyExpire;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  return userObj;
};

// @POST /api/auth/register
// Registers user in unverified state and sends 6-digit email verification OTP
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role, college, branch, semester } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email is already registered and verified. Please log in.',
        });
      }

      // Existing unverified account: update credentials and resend verification OTP
      existingUser.name = name.trim();
      existingUser.password = password;
      if (role) existingUser.role = role === 'teacher' ? 'teacher' : 'student';
      if (college) existingUser.college = college;
      if (branch) existingUser.branch = branch;
      if (semester) existingUser.semester = semester;
      await existingUser.save();

      try {
        await createAndSendOtp({
          email: normalizedEmail,
          name: existingUser.name,
          purpose: 'email_verification',
          resend: true,
        });
      } catch (otpErr) {
        if (otpErr.statusCode === 429) {
          return res.status(429).json({ success: false, message: otpErr.message });
        }
        console.error('Failed to send verification OTP:', otpErr.message);
      }

      return res.status(200).json({
        success: true,
        requiresEmailVerification: true,
        email: normalizedEmail,
        message: 'Account exists but is unverified. A new verification code has been sent to your email.',
      });
    }

    // Create new user
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_USER.trim();
    const isDevMode = process.env.NODE_ENV !== 'production' && !emailConfigured;

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === 'teacher' ? 'teacher' : 'student',
      college: college || '',
      branch: branch || '',
      semester: semester || 1,
      isEmailVerified: isDevMode ? true : false,
    });

    if (isDevMode) {
      const token = signToken(user._id);
      console.log(`[DEV] Registration auto-verified for ${normalizedEmail} (EMAIL_USER not configured).`);
      return res.status(201).json({
        success: true,
        message: 'Registration successful! (Development mode — email auto-verified).',
        token,
        user: sanitizeUser(user),
      });
    }

    // Send 6-digit email verification OTP
    try {
      await createAndSendOtp({
        email: normalizedEmail,
        name: user.name,
        purpose: 'email_verification',
      });
    } catch (otpErr) {
      console.error('Failed to dispatch registration OTP:', otpErr.message);
    }

    // Do NOT issue access token yet: user must verify OTP first
    res.status(201).json({
      success: true,
      requiresEmailVerification: true,
      email: normalizedEmail,
      message: 'Registration successful! A 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/verify-email-otp
// Verifies registration OTP and activates the account
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Verify OTP against purpose: email_verification
    const result = await verifyOtp({
      email: normalizedEmail,
      otp,
      purpose: 'email_verification',
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Activate email verification status
    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Issue full access JWT
    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to EduNexa.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/login
// Step 1 of Login: Validates password.
// If unverified -> sends email verification OTP.
// If verified -> sends 2FA login OTP and issues temporary token (NO access token yet).
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    // Strict Gate: If email is not verified, require email verification first
    if (!user.isEmailVerified) {
      try {
        await createAndSendOtp({
          email: normalizedEmail,
          name: user.name,
          purpose: 'email_verification',
        });
      } catch (otpErr) {
        console.error('Failed to send verification OTP during login:', otpErr.message);
      }

      return res.status(403).json({
        success: false,
        requiresEmailVerification: true,
        email: normalizedEmail,
        message: 'Your email address is not verified. A verification code has been sent to your Gmail inbox.',
      });
    }

    // ── DEVELOPMENT MODE BYPASS ──────────────────────────────────────────────
    // When EMAIL_USER is not configured, skip 2FA and issue the access token
    // directly so developers can test the app without a Gmail account.
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_USER.trim();
    if (process.env.NODE_ENV !== 'production' && !emailConfigured) {
      user.lastLogin = new Date();
      if (typeof user.updateStreak === 'function') user.updateStreak();
      await user.save({ validateBeforeSave: false });
      const token = signToken(user._id);
      console.log('[DEV] 2FA bypassed — EMAIL_USER not set. Issuing token directly.');
      return res.status(200).json({
        success: true,
        message: 'Login successful (development mode – 2FA bypassed because Gmail is not configured).',
        token,
        user: sanitizeUser(user),
      });
    }
    // ── END DEV BYPASS ───────────────────────────────────────────────────────

    // Step 2: User credentials valid and verified. Send 6-digit Login OTP (2FA)
    try {
      await createAndSendOtp({
        email: normalizedEmail,
        name: user.name,
        purpose: 'login_verification',
      });
    } catch (otpErr) {
      if (otpErr.statusCode === 429) {
        return res.status(429).json({ success: false, message: otpErr.message });
      }
      console.error('Failed to send login OTP:', otpErr.message);
    }

    // Generate short-lived temp token (10 mins) restricted to login completion only
    const tempToken = jwt.sign(
      { id: user._id, email: normalizedEmail, type: 'login_pending' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      success: true,
      requiresLoginOtp: true,
      tempToken,
      email: normalizedEmail,
      message: 'Verification code sent to your registered Gmail address. Please enter the 6-digit code to complete login.',
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/verify-login-otp
// Step 2 of Login: Verifies the 6-digit login OTP and issues the full application JWT
exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp, tempToken } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify tempToken if supplied to ensure valid login session
    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (decoded.type !== 'login_pending' || decoded.email !== normalizedEmail) {
          return res.status(401).json({ success: false, message: 'Invalid or expired login session. Please sign in again.' });
        }
      } catch (jwtErr) {
        return res.status(401).json({ success: false, message: 'Login session expired. Please enter your credentials again.' });
      }
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Verify OTP with purpose: login_verification
    const result = await verifyOtp({
      email: normalizedEmail,
      otp,
      purpose: 'login_verification',
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Update login timestamps and streaks
    user.lastLogin = new Date();
    user.updateStreak();
    await user.save({ validateBeforeSave: false });

    // Issue authentic full-access application JWT
    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login verification successful! Welcome back.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/resend-otp
// Resends OTP with 60-second cooldown enforcement
exports.resendOtp = async (req, res, next) => {
  try {
    const { email, purpose = 'email_verification' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const validPurposes = ['email_verification', 'login_verification', 'password_reset'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP purpose specified.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Don't reveal user absence
      return res.status(200).json({ success: true, message: 'If this email is registered, a new verification code has been dispatched.' });
    }

    await createAndSendOtp({
      email: normalizedEmail,
      name: user.name,
      purpose,
      resend: true,
    });

    res.status(200).json({
      success: true,
      message: `A fresh 6-digit verification code has been sent to ${normalizedEmail}.`,
    });
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: error.message,
        cooldownRemaining: error.cooldownRemaining,
      });
    }
    next(error);
  }
};

// @POST /api/auth/forgot-password
// Sends 6-digit password reset OTP
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Protect against user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
      });
    }

    try {
      await createAndSendOtp({
        email: normalizedEmail,
        name: user.name,
        purpose: 'password_reset',
      });
    } catch (otpErr) {
      if (otpErr.statusCode === 429) {
        return res.status(429).json({ success: false, message: otpErr.message });
      }
      console.error('Failed to send password reset OTP:', otpErr.message);
    }

    res.status(200).json({
      success: true,
      email: normalizedEmail,
      message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/reset-password
// Verifies reset OTP and updates user password securely
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Email, verification code, and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    // Verify password reset OTP
    const result = await verifyOtp({
      email: normalizedEmail,
      otp,
      purpose: 'password_reset',
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Update password (pre-save hook hashes with bcrypt automatically)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/logout
exports.logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};
