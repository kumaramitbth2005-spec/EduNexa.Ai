/**
 * EduNexa Email Service
 *
 * Provider selection (EMAIL_PROVIDER env var):
 *   "resend"    → Resend HTTPS API (recommended — works everywhere, no SMTP ports needed)
 *   "nodemailer" or unset → Nodemailer Gmail SMTP (requires ports 465/587 open)
 *
 * On Render (and most cloud hosts), SMTP ports are blocked.
 * Use Resend for reliable OTP delivery.
 */

// ─── RESEND (HTTPS API) ───────────────────────────────────────────────────────

let _resendClient = null;

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (!apiKey) return null;
  if (_resendClient) return _resendClient;
  try {
    const { Resend } = require('resend');
    _resendClient = new Resend(apiKey);
    return _resendClient;
  } catch (err) {
    console.error('[EMAIL] Failed to initialize Resend client:', err.message);
    return null;
  }
};

const sendViaResend = async ({ to, subject, html, text, fromAddress }) => {
  const resend = getResendClient();
  if (!resend) {
    return {
      success: false,
      error: 'RESEND_NOT_CONFIGURED',
      message: 'RESEND_API_KEY is not set in backend environment variables. Get a free key at https://resend.com',
    };
  }

  const cleanRecipient = (to || '').trim().toLowerCase();

  try {
    console.log(`[EMAIL] Sending via Resend HTTPS API to ${cleanRecipient}...`);
    const { data, error } = await resend.emails.send({
      from: fromAddress || 'EduNexa Security <onboarding@resend.dev>',
      to: [cleanRecipient],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[EMAIL RESEND ERROR]', error.message || JSON.stringify(error));
      return {
        success: false,
        error: 'RESEND_API_ERROR',
        message: `Resend API rejected the email: ${error.message || JSON.stringify(error)}`,
      };
    }

    console.log(`[EMAIL] Resend accepted the email. ID: ${data.id}`);
    return {
      success: true,
      messageId: data.id,
      provider: 'resend',
    };
  } catch (err) {
    console.error('[EMAIL RESEND EXCEPTION]', err.message);
    return {
      success: false,
      error: 'RESEND_EXCEPTION',
      message: `Resend API call failed: ${err.message}`,
    };
  }
};

// ─── NODEMAILER / GMAIL SMTP ──────────────────────────────────────────────────

let cachedTransporter = null;
let lastUser = null;
let lastPass = null;

const getSmtpTransporter = () => {
  const nodemailer = require('nodemailer');
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const pass = process.env.EMAIL_APP_PASSWORD
    ? process.env.EMAIL_APP_PASSWORD.trim().replace(/\s+/g, '')
    : (process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '');

  if (!user || !pass) return null;

  if (cachedTransporter && lastUser === user && lastPass === pass) return cachedTransporter;

  lastUser = user;
  lastPass = pass;

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return cachedTransporter;
};

const sendViaSmtp = async ({ to, subject, html, text }) => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const pass = process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.trim() : '';

  if (!user || !pass) {
    if (text) console.warn(`[EMAIL DEV BACKUP] OTP for ${to}:\n${text}\n`);
    return {
      success: false,
      error: 'EMAIL_CONFIG_MISSING',
      message: 'EMAIL_USER and EMAIL_APP_PASSWORD are not configured. Set RESEND_API_KEY instead for reliable delivery.',
    };
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'SMTP_TRANSPORTER_UNAVAILABLE',
      message: 'Could not build Nodemailer transporter. Check EMAIL_USER / EMAIL_APP_PASSWORD.',
    };
  }

  const cleanRecipient = (to || '').trim().toLowerCase();
  const senderFrom = `"EduNexa Security" <${user}>`;

  try {
    console.log(`[EMAIL] Attempting Gmail SMTP delivery to ${cleanRecipient}...`);
    const info = await transporter.sendMail({ from: senderFrom, to: cleanRecipient, subject, html, text });

    const isAccepted = Array.isArray(info.accepted) && info.accepted.includes(cleanRecipient);
    console.log(`[EMAIL] Gmail SMTP | Accepted: ${isAccepted} | MessageId: ${info.messageId}`);

    if (!isAccepted && Array.isArray(info.rejected) && info.rejected.includes(cleanRecipient)) {
      return { success: false, error: 'RECIPIENT_REJECTED', message: `Recipient ${cleanRecipient} was rejected by Gmail SMTP.` };
    }

    return { success: true, messageId: info.messageId, accepted: info.accepted, provider: 'nodemailer', response: info.response };
  } catch (err) {
    console.error(`[EMAIL SMTP ERROR] to ${cleanRecipient}:`, err.message);
    if (err.message && (err.message.includes('auth') || err.message.includes('Invalid login'))) {
      cachedTransporter = null;
    }
    return {
      success: false,
      error: err.code === 'ETIMEDOUT' || err.message.includes('timeout') ? 'SMTP_TIMEOUT' : 'SMTP_ERROR',
      message: `Gmail SMTP failed: ${err.message}`,
    };
  }
};

// ─── UNIFIED PUBLIC API ───────────────────────────────────────────────────────

/**
 * Determine which email provider is configured and active.
 * Priority: Resend (HTTPS) > Nodemailer (SMTP)
 */
const detectProvider = () => {
  const explicit = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  if (explicit === 'nodemailer' || explicit === 'smtp') return 'nodemailer';
  if (explicit === 'resend') return 'resend';
  // Auto-detect: prefer Resend when RESEND_API_KEY is set
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) return 'resend';
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) return 'nodemailer';
  return 'none';
};

/**
 * Main send function — routes to Resend or Nodemailer based on configuration.
 */
exports.sendEmail = async ({ to, subject, html, text }) => {
  const provider = detectProvider();

  if (provider === 'resend') {
    // Resend free tier requires verified domain OR uses onboarding@resend.dev for testing
    const resendFrom = process.env.EMAIL_FROM_RESEND || process.env.EMAIL_FROM || 'EduNexa Security <onboarding@resend.dev>';
    return sendViaResend({ to, subject, html, text, fromAddress: resendFrom });
  }

  if (provider === 'nodemailer') {
    return sendViaSmtp({ to, subject, html, text });
  }

  // No provider configured at all
  const cleanTo = (to || '').trim();
  console.warn(`[EMAIL] No email provider configured. Cannot deliver OTP to ${cleanTo}.`);
  if (text) console.warn(`[EMAIL DEV BACKUP]\n${text}\n`);
  return {
    success: false,
    error: 'NO_EMAIL_PROVIDER',
    message: 'No email provider configured. Please set RESEND_API_KEY (recommended) or EMAIL_USER + EMAIL_APP_PASSWORD in Render Environment Variables.',
  };
};

/**
 * Verify the configured email provider's connection / credentials.
 */
exports.verifySmtpConnection = async () => {
  const provider = detectProvider();

  if (provider === 'resend') {
    const resend = getResendClient();
    if (!resend) {
      return { configured: false, provider: 'resend', message: 'RESEND_API_KEY is not set.' };
    }
    // Resend has no server "ping" — a successful initialization is enough to confirm the key was accepted.
    // Real validation happens on first send.
    return {
      configured: true,
      provider: 'resend',
      message: 'Resend client initialized. First send will validate the API key.',
    };
  }

  if (provider === 'nodemailer') {
    const transporter = getSmtpTransporter();
    if (!transporter) {
      return { configured: false, provider: 'nodemailer', message: 'EMAIL_USER or EMAIL_APP_PASSWORD is not set.' };
    }
    try {
      await transporter.verify();
      return {
        configured: true,
        authenticated: true,
        provider: 'nodemailer',
        message: 'Gmail SMTP authenticated successfully.',
      };
    } catch (err) {
      return {
        configured: true,
        authenticated: false,
        provider: 'nodemailer',
        error: err.message,
        message: `Gmail SMTP failed: ${err.message}`,
      };
    }
  }

  return {
    configured: false,
    provider: 'none',
    message: 'No email provider configured. Set RESEND_API_KEY or EMAIL_USER + EMAIL_APP_PASSWORD.',
  };
};

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

/**
 * Template for Registration Email Verification OTP
 */
exports.getEmailVerificationTemplate = (name, otp, expiryMinutes = 5) => {
  const firstName = name ? name.split(' ')[0] : 'Student';
  const text = `Hello ${firstName},\n\nWelcome to EduNexa!\nYour email verification code is:\n${otp}\n\nThis code is valid for ${expiryMinutes} minutes.\nIf you did not request this verification, please ignore this email.\n\nRegards,\nEduNexa Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800;">EduNexa</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">AI-Powered Smart Education Platform</p>
      </div>
      
      <p style="color: #334155; font-size: 16px; margin: 0 0 16px 0;">Hello <strong>${firstName}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Welcome to EduNexa! Please verify your email address to complete your registration and activate your account.
      </p>
      
      <div style="background: #f8fafc; border: 2px dashed #6366f1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6366f1; letter-spacing: 1px; margin-bottom: 8px;">Your Email Verification Code</span>
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #1e1b4b; font-family: monospace;">${otp}</span>
        <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for <strong>${expiryMinutes} minutes</strong></span>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
        If you did not request this verification, please ignore this email or contact support.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        &copy; ${new Date().getFullYear()} EduNexa. All rights reserved.
      </p>
    </div>
  `;

  return { subject: 'Verify Your EduNexa Account', text, html };
};

/**
 * Template for Login 2FA OTP
 */
exports.getLoginOtpTemplate = (name, otp, expiryMinutes = 5) => {
  const firstName = name ? name.split(' ')[0] : 'Student';
  const text = `Hello ${firstName},\n\nA login request was initiated for your EduNexa account.\nYour two-step login verification code is:\n${otp}\n\nThis code is valid for ${expiryMinutes} minutes.\nIf you did not attempt to log in, please secure your account immediately.\n\nRegards,\nEduNexa Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800;">EduNexa</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Two-Step Login Verification</p>
      </div>
      
      <p style="color: #334155; font-size: 16px; margin: 0 0 16px 0;">Hello <strong>${firstName}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        We received a request to log in to your EduNexa account. Enter the verification code below to complete sign-in:
      </p>
      
      <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #0284c7; letter-spacing: 1px; margin-bottom: 8px;">Login Verification Code</span>
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #082f49; font-family: monospace;">${otp}</span>
        <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for <strong>${expiryMinutes} minutes</strong></span>
      </div>

      <p style="color: #ef4444; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
        &#9888;&#65039; Never share this code with anyone. EduNexa representatives will never ask for your code.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        &copy; ${new Date().getFullYear()} EduNexa Security. All rights reserved.
      </p>
    </div>
  `;

  return { subject: 'Your EduNexa Login Verification Code', text, html };
};

/**
 * Template for Password Reset OTP
 */
exports.getPasswordResetOtpTemplate = (name, otp, expiryMinutes = 5) => {
  const firstName = name ? name.split(' ')[0] : 'User';
  const text = `Hello ${firstName},\n\nYou requested a password reset for your EduNexa account.\nYour password reset code is:\n${otp}\n\nThis code is valid for ${expiryMinutes} minutes.\nIf you did not request a password reset, please ignore this email.\n\nRegards,\nEduNexa Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #dc2626; margin: 0; font-size: 26px; font-weight: 800;">EduNexa</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Password Reset Request</p>
      </div>
      
      <p style="color: #334155; font-size: 16px; margin: 0 0 16px 0;">Hello <strong>${firstName}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        We received a request to reset your password. Use the verification code below to proceed:
      </p>
      
      <div style="background: #fef2f2; border: 2px dashed #ef4444; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #dc2626; letter-spacing: 1px; margin-bottom: 8px;">Password Reset Code</span>
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #7f1d1d; font-family: monospace;">${otp}</span>
        <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for <strong>${expiryMinutes} minutes</strong></span>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
        If you did not request a password reset, please ignore this message. Your existing password remains unchanged.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        &copy; ${new Date().getFullYear()} EduNexa. All rights reserved.
      </p>
    </div>
  `;

  return { subject: 'EduNexa — Password Reset Code', text, html };
};
