/**
 * EduNexa Email Provider Diagnostic Tool
 * Usage:
 *   node backend/test_email_diagnostic.js
 *   node backend/test_email_diagnostic.js your_test_email@gmail.com
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { verifySmtpConnection, sendEmail } = require('./utils/email');

async function runDiagnostic() {
  console.log('================================================================');
  console.log('📧  EDUNEXA EMAIL PROVIDER DIAGNOSTIC TOOL');
  console.log('================================================================\n');

  const provider = process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : (process.env.EMAIL_USER ? 'nodemailer' : 'none'));
  console.log(`Active Provider:  ${provider.toUpperCase()}`);
  console.log(`RESEND_API_KEY:   ${process.env.RESEND_API_KEY ? '✅ Set (' + process.env.RESEND_API_KEY.length + ' chars)' : '❌ Not set'}`);
  console.log(`EMAIL_USER:       ${process.env.EMAIL_USER ? '✅ ' + process.env.EMAIL_USER.replace(/(?<=.{2}).(?=.*@)/g, '*') : '❌ Not set'}`);
  console.log(`EMAIL_APP_PASS:   ${process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log('');

  if (provider === 'none') {
    console.log('❌ NO EMAIL PROVIDER CONFIGURED');
    console.log('----------------------------------------------------------------');
    console.log('Quick fix: Set RESEND_API_KEY in Render Environment Variables.');
    console.log('1. Go to https://resend.com and create a free account.');
    console.log('2. Create an API key (100 free emails/day).');
    console.log('3. In Render Dashboard → Your Web Service → Environment:');
    console.log('   RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxx');
    console.log('   EMAIL_PROVIDER = resend');
    console.log('4. Click "Save and deploy".');
    return;
  }

  if (provider === 'resend') {
    if (!process.env.RESEND_API_KEY) {
      console.log('❌ RESEND_API_KEY is missing. Add it to backend/.env or Render Environment Variables.');
      return;
    }
    console.log('✅ Resend client ready.');
    console.log('NOTE: Resend does not expose a "ping" API. The first send will validate the key.\n');
  }

  if (provider === 'nodemailer') {
    console.log('Testing Gmail SMTP connectivity...');
    const status = await verifySmtpConnection();
    if (status.authenticated) {
      console.log(`✅ Gmail SMTP authenticated: ${status.user || process.env.EMAIL_USER}`);
    } else {
      console.log('❌ Gmail SMTP failed:', status.error || status.message);
      console.log('\nCommon causes:');
      console.log('  - Port 465/587 blocked by ISP or cloud host → Switch to Resend (HTTPS).');
      console.log('  - Wrong App Password → Generate a 16-char Google App Password at https://myaccount.google.com/apppasswords');
      return;
    }
  }

  // If a recipient was supplied as argument, run a full send test
  const testRecipient = process.argv[2];
  if (testRecipient) {
    console.log(`\nSending real test email to: ${testRecipient} ...`);
    const result = await sendEmail({
      to: testRecipient,
      subject: 'EduNexa Email Delivery Test',
      text: 'This is a diagnostic test from EduNexa. If you received this, the email provider is working correctly.',
      html: '<div style="font-family:Arial;padding:20px"><h2 style="color:#4f46e5">EduNexa Test ✅</h2><p>Your email provider is configured and working correctly!</p></div>',
    });

    if (result.success) {
      console.log(`✅ Email accepted! Message ID: ${result.messageId}`);
      console.log(`Check ${testRecipient} inbox AND spam folder.`);
    } else {
      console.log(`❌ Delivery failed: ${result.message}`);
    }
  } else {
    console.log('\nTip: Run with a recipient email to send a live test:');
    console.log('  node backend/test_email_diagnostic.js your@gmail.com');
  }

  console.log('\n================================================================\n');
}

runDiagnostic().catch(console.error);
