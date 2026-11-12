const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAndSendOtp, verifyOtp } = require('../utils/otpHelper');
const { verifySmtpConnection, sendEmail } = require('../utils/email');

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
    // Fast fail if database is not connected
    if (User.db.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently connecting or unavailable. Please verify MONGODB_URI in server settings and try again in a few moments.',
      });
    }

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

      let otpResult = { success: true };
      try {
        otpResult = await createAndSendOtp({
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
        otpResult = { success: false, message: otpErr.message };
      }

      if (!otpResult.success) {
        return res.status(200).json({
          success: true,
          requiresEmailVerification: true,
          emailDelivered: false,
          email: normalizedEmail,
          message: `Account details updated, but verification email could not be sent: ${otpResult.message || 'Email delivery failed'}. Please check email settings or click "Resend Code".`,
        });
      }

      return res.status(200).json({
        success: true,
        requiresEmailVerification: true,
        emailDelivered: true,
        email: normalizedEmail,
        message: 'Account exists but is unverified. A new verification code has been sent to your email.',
      });
    }

    // Create new unverified user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === 'teacher' ? 'teacher' : 'student',
      college: college || '',
      branch: branch || '',
      semester: semester || 1,
      isEmailVerified: false,
    });

    // Send 6-digit email verification OTP
    let otpResult = { success: true };
    try {
      otpResult = await createAndSendOtp({
        email: normalizedEmail,
        name: user.name,
        purpose: 'email_verification',
      });
    } catch (otpErr) {
      console.error('Failed to dispatch registration OTP:', otpErr.message);
      otpResult = { success: false, message: otpErr.message };
    }

    if (!otpResult.success) {
      return res.status(201).json({
        success: true,
        requiresEmailVerification: true,
        emailDelivered: false,
        email: normalizedEmail,
        message: `Account created successfully! However, verification email delivery failed: ${otpResult.message || 'Email delivery error'}. Please use "Resend Code" once email settings are verified.`,
      });
    }

    // Do NOT issue access token yet: user must verify OTP first
    res.status(201).json({
      success: true,
      requiresEmailVerification: true,
      emailDelivered: true,
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

    // Step 2: User credentials valid and verified. Send 6-digit Login OTP (2FA)
    let otpResult = { success: true };
    try {
      otpResult = await createAndSendOtp({
        email: normalizedEmail,
        name: user.name,
        purpose: 'login_verification',
      });
    } catch (otpErr) {
      if (otpErr.statusCode === 429) {
        return res.status(429).json({ success: false, message: otpErr.message });
      }
      console.error('Failed to send login OTP:', otpErr.message);
      otpResult = { success: false, message: otpErr.message };
    }

    if (!otpResult.success) {
      return res.status(502).json({
        success: false,
        message: `Failed to deliver login code to your Gmail: ${otpResult.message || 'SMTP service error'}. Please check server email settings.`,
      });
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

    const otpResult = await createAndSendOtp({
      email: normalizedEmail,
      name: user.name,
      purpose,
      resend: true,
    });

    if (!otpResult.success) {
      return res.status(502).json({
        success: false,
        message: otpResult.message || 'Failed to dispatch verification email. Please check server email settings.',
      });
    }

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

// @GET /api/auth/smtp-status
// Returns the status of the SMTP service without leaking any secrets
exports.checkSmtpStatus = async (req, res) => {
  try {
    const status = await verifySmtpConnection();
    res.status(200).json({
      success: status.authenticated || false,
      configured: status.configured || false,
      authenticated: status.authenticated || false,
      user: status.user || null,
      message: status.message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      configured: false,
      authenticated: false,
      message: err.message,
    });
  }
};

// @POST /api/auth/test-email
// Sends a diagnostic test email to verify Gmail delivery and inbox arrival
exports.testEmailDelivery = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await sendEmail({
      to: normalizedEmail,
      subject: 'EduNexa - Email Verification System Test',
      text: `Hello!\n\nThis is a diagnostic test email from your EduNexa platform.\nIf you received this in your inbox, your Gmail SMTP configuration is 100% working!\n\nTimestamp: ${new Date().toISOString()}\n\nRegards,\nEduNexa Engineering`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">EduNexa SMTP Test Passed! ✅</h2>
          <p>This email confirms that your Gmail SMTP credentials and Nodemailer configuration are functioning properly.</p>
          <p style="font-size: 13px; color: #64748b;">Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: result.message || 'Failed to dispatch test email through Gmail SMTP.',
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: `Test email accepted by Gmail! Message ID: ${result.messageId}. Please check ${normalizedEmail} inbox and spam folder.`,
      accepted: result.accepted,
      messageId: result.messageId,
    });
  } catch (error) {
    next(error);
  }
};
