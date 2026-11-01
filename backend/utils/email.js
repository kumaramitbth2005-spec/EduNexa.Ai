const nodemailer = require('nodemailer');

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // Support Gmail service configuration or custom SMTP
  const isGmail = (process.env.EMAIL_HOST || 'smtp.gmail.com').includes('gmail') || user.endsWith('@gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user, pass },
  });
};

/**
 * Sends an email via Nodemailer (Gmail SMTP)
 */
exports.sendEmail = async ({ to, subject, html, text }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn(`\n[EMAIL NOTICE] No EMAIL_USER/EMAIL_APP_PASSWORD configured in backend/.env.`);
    console.warn(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    if (text) console.warn(`[EMAIL BODY]:\n${text}\n`);
    return { success: true, simulated: true };
  }

  const transporter = getTransporter();
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"EduNexa Security" <${user}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[EMAIL DELIVERED] Successfully sent email to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
    throw err;
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
