require('dotenv').config({ path: __dirname + '/.env' });
const { verifySmtpConnection, sendEmail } = require('./utils/email');

async function runEmailDiagnostic() {
  console.log('================================================================');
  console.log('📧 EDUNEXA GMAIL SMTP & OTP DELIVERY DIAGNOSTIC TOOL');
  console.log('================================================================\n');

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  console.log('1. ENVIRONMENT VARIABLE INSPECTION:');
  console.log(`- EMAIL_HOST:         ${process.env.EMAIL_HOST || 'smtp.gmail.com (default)'}`);
  console.log(`- EMAIL_PORT:         ${process.env.EMAIL_PORT || '465 / 587'}`);
  console.log(`- EMAIL_USER:         ${user ? user.replace(/(?<=.{2}).(?=.*@)/g, '*') : '❌ EMPTY / NOT SET'}`);
  console.log(`- EMAIL_APP_PASSWORD: ${pass ? '✅ Set (' + pass.length + ' chars)' : '❌ EMPTY / NOT SET'}`);
  console.log(`- EMAIL_FROM:         ${process.env.EMAIL_FROM || '"EduNexa Security" <' + (user || 'user') + '>'}`);

  if (!user || !pass) {
    console.log('\n❌ DIAGNOSTIC RESULT: EMAIL CREDENTIALS ARE MISSING IN backend/.env');
    console.log('----------------------------------------------------------------');
    console.log('Why OTP was never delivered to Gmail:');
    console.log('Nodemailer cannot connect to Google mail servers without an authenticated Gmail account and a 16-character Google App Password.');
    console.log('\nHOW TO FIX IN 2 MINUTES:');
    console.log('1. Go to your Google Account (myaccount.google.com).');
    console.log('2. Click Security on the left menu.');
    console.log('3. Ensure "2-Step Verification" is ON.');
    console.log('4. Search "App passwords" in the top search bar (or go to: https://myaccount.google.com/apppasswords).');
    console.log('5. Create an App password named "EduNexa".');
    console.log('6. Copy the 16-character password (e.g. "abcd efgh ijkl mnop").');
    console.log('7. Put it into backend/.env and Render Environment Variables:');
    console.log('   EMAIL_USER=your_email@gmail.com');
    console.log('   EMAIL_APP_PASSWORD=abcdefghijklmnop');
    console.log('================================================================\n');
    return;
  }

  console.log('\n2. TESTING GMAIL SMTP CONNECTION & AUTHENTICATION...');
  const verifyResult = await verifySmtpConnection();
  if (verifyResult.authenticated) {
    console.log(`✅ SUCCESS: ${verifyResult.message}`);
    console.log(`Authenticated as: ${verifyResult.user}`);

    // If an argument is provided, attempt sending real test email
    const targetRecipient = process.argv[2];
    if (targetRecipient) {
      console.log(`\n3. DISPATCHING REAL TEST EMAIL TO: ${targetRecipient}...`);
      const sendResult = await sendEmail({
        to: targetRecipient,
        subject: 'EduNexa - SMTP Verification Test',
        text: 'This is a test email from EduNexa to confirm that your Gmail SMTP is successfully delivering OTP emails to real inboxes.',
      });

      if (sendResult.success) {
        console.log(`✅ EMAIL ACCEPTED BY GMAIL!`);
        console.log(`- Message ID: ${sendResult.messageId}`);
        console.log(`- Accepted Recipients: ${sendResult.accepted.join(', ')}`);
      } else {
        console.log(`❌ EMAIL REJECTED: ${sendResult.message}`);
      }
    }
  } else {
    console.log(`❌ SMTP CONNECTION FAILED:`);
    console.log(`Error: ${verifyResult.error || verifyResult.message}`);
    if (verifyResult.error && verifyResult.error.includes('Username and Password not accepted')) {
      console.log('\n👉 EAUTH CAUSE: Google rejected your password.');
      console.log('   You MUST generate a 16-character Google "App Password" from https://myaccount.google.com/apppasswords.');
      console.log('   Do NOT use your personal Gmail login password.');
    }
  }

  console.log('\n================================================================\n');
}

runEmailDiagnostic().catch(console.error);
