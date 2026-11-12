const nodemailer = require('nodemailer');

let cachedTransporter = null;
let lastUser = null;
let lastPass = null;

const getTransporter = () => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const pass = process.env.EMAIL_APP_PASSWORD
    ? process.env.EMAIL_APP_PASSWORD.trim().replace(/\s+/g, '') // remove any spaces if user pasted "abcd efgh ijkl mnop"
    : (process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '');

  if (!user || !pass) {
    return null;
  }

  // Reuse pooled transporter if credentials have not changed
  if (cachedTransporter && lastUser === user && lastPass === pass) {
    return cachedTransporter;
  }

  lastUser = user;
  lastPass = pass;

  const isGmail = (process.env.EMAIL_HOST || 'smtp.gmail.com').includes('gmail') || user.endsWith('@gmail.com');

  if (isGmail) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      pool: true, // Connection pooling maintains open socket to eliminate 3-second handshake latency
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
    });
    return cachedTransporter;
  }

  const port = Number(process.env.EMAIL_PORT) || 465;
  const isSecure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });

  return cachedTransporter;
};

/**
 * Mask email address for safe logging/display (e.g. am***@gmail.com)
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return 'configured';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

/**
 * Verify SMTP connection and authentication status
 */
exports.verifySmtpConnection = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'EMAIL_USER or EMAIL_APP_PASSWORD is not set in backend/.env',
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      authenticated: true,
      user: maskEmail(process.env.EMAIL_USER),
      message: 'Gmail SMTP connection authenticated successfully',
    };
  } catch (err) {
    return {
      configured: true,
      authenticated: false,
      user: maskEmail(process.env.EMAIL_USER),
      error: err.message,
      message: `Gmail SMTP authentication failed: ${err.message}`,
    };
  }
};

/**
 * Sends an email via Nodemailer (Gmail SMTP with connection pooling)
 * Strictly verifies whether the email was accepted by the provider
 */
exports.sendEmail = async ({ to, subject, html, text }) => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const pass = process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.trim() : '';

  if (!user || !pass) {
    console.warn(`\n[EMAIL ALERT] No EMAIL_USER / EMAIL_APP_PASSWORD configured in backend/.env.`);
    console.warn(`[EMAIL ALERT] Cannot deliver real OTP to inbox: ${to}`);
    if (text) console.warn(`[DEVELOPMENT BACKUP]:\n${text}\n`);
    return {
      success: false,
      error: 'EMAIL_CONFIG_MISSING',
      message: 'Email service is not configured on the server. Please configure EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env.',
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'EMAIL_TRANSPORTER_UNAVAILABLE',
      message: 'Failed to initialize email transporter. Please check email credentials.',
    };
  }

  const cleanRecipient = (to || '').trim().toLowerCase();

  // Gmail SMTP strictly requires the 'from' address to match the authenticated Gmail user.
  // Using an external domain (e.g. noreply@edunexa.com) causes Google to reject or spam-filter the message under SPF/DMARC policies.
  const senderFrom = `"EduNexa Security" <${user}>`;

  try {
    console.log(`[EMAIL DISPATCH] Attempting delivery to ${cleanRecipient} via Gmail SMTP...`);

    const info = await transporter.sendMail({
      from: senderFrom,
      to: cleanRecipient,
      subject,
      html,
      text,
    });

    const isAccepted = Array.isArray(info.accepted) && info.accepted.includes(cleanRecipient);
    console.log(`[EMAIL DISPATCH] Sent to ${cleanRecipient} | Accepted by Gmail: ${isAccepted} | MessageId: ${info.messageId}`);

    if (!isAccepted && Array.isArray(info.rejected) && info.rejected.includes(cleanRecipient)) {
      console.warn(`[EMAIL REJECTED] Recipient was rejected by SMTP provider: ${cleanRecipient}`);
      return {
        success: false,
        error: 'RECIPIENT_REJECTED',
        message: `Recipient email ${cleanRecipient} was rejected by Gmail SMTP.`,
        messageId: info.messageId,
      };
    }

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    };
  } catch (err) {
    console.error(`[EMAIL SMTP ERROR] Failed to send email to ${cleanRecipient}:`, err.message);
    // Invalidate cached transporter on auth failure so next request can retry fresh
    if (err.message && (err.message.includes('auth') || err.message.includes('credential') || err.message.includes('Invalid login'))) {
      cachedTransporter = null;
    }
    return {
      success: false,
      error: 'SMTP_DELIVERY_FAILED',
      message: `Failed to deliver email via Gmail SMTP: ${err.message}`,
    };
  }
};

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
        ⚠️ Never share this code with anyone. EduNexa representatives will never ask for your code.
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
