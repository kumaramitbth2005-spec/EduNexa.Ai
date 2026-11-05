require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const mongoose = require('mongoose');
const Otp = require('./models/Otp');
const User = require('./models/User');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function runAuthTests() {
  console.log('================================================================');
  console.log('🔒 TESTING EDUNEXA COMPLETE AUTHENTICATION & OTP 2FA SYSTEM');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edunexa';
  console.log(`Connecting test suite to MongoDB...`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected for test verification: ${mongoose.connection.host}\n`);

  const testEmail = `test_student_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  const testName = 'Test Student';

  try {
    // -------------------------------------------------------------
    // Test 1: Public route access check & Unauthenticated protection
    // -------------------------------------------------------------
    console.log('[1] Strict Protection Check — Unauthenticated Access:');
    const unauthRes = await fetch(`${BASE_URL}/courses/student/enrolled`);
    const unauthData = await unauthRes.json();
    console.log(`Status: ${unauthRes.status} | Code: ${unauthData.code || unauthData.message}`);
    if (unauthRes.status === 401) {
      console.log('✅ PASS: Protected endpoint rejected unauthenticated request.\n');
    } else {
      throw new Error('FAIL: Protected endpoint allowed unauthenticated request!');
    }

    // -------------------------------------------------------------
    // Test 2: User Registration (Unverified State)
    // -------------------------------------------------------------
    console.log('[2] User Registration:');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'student',
      }),
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status} | Requires Email Verification: ${regData.requiresEmailVerification}`);
    if (regRes.status === 201 && regData.requiresEmailVerification && !regData.token) {
      console.log('✅ PASS: Account created in unverified state without issuing access token.\n');
    } else {
      throw new Error(`FAIL: Registration did not behave as expected: ${JSON.stringify(regData)}`);
    }

    // -------------------------------------------------------------
    // Test 3: Attempt Login Before Email Verification
    // -------------------------------------------------------------
    console.log('[3] Login Attempt on Unverified Account:');
    const unverifiedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const unverifiedLoginData = await unverifiedLoginRes.json();
    console.log(`Status: ${unverifiedLoginRes.status} | Message: "${unverifiedLoginData.message}"`);
    if (unverifiedLoginData.requiresEmailVerification) {
      console.log('✅ PASS: Login blocked; prompt to verify email returned.\n');
    } else {
      throw new Error('FAIL: Login permitted on unverified account!');
    }

    // -------------------------------------------------------------
    // Test 4: Email Verification OTP (Incorrect Code Rejection)
    // -------------------------------------------------------------
    console.log('[4] Email Verification with WRONG OTP:');
    const wrongOtpRes = await fetch(`${BASE_URL}/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' }),
    });
    const wrongOtpData = await wrongOtpRes.json();
    console.log(`Status: ${wrongOtpRes.status} | Message: "${wrongOtpData.message}"`);
    if (wrongOtpRes.status === 400) {
      console.log('✅ PASS: Incorrect OTP rejected and attempts logged.\n');
    } else {
      throw new Error('FAIL: Wrong OTP was accepted!');
    }

    // -------------------------------------------------------------
    // Test 5: Email Verification OTP (Correct Code)
    // -------------------------------------------------------------
    console.log('[5] Email Verification with CORRECT OTP:');
    // Read active OTP from DB for testing
    const emailOtpRecord = await Otp.findOne({
      email: testEmail.toLowerCase(),
      purpose: 'email_verification',
      isUsed: false,
    });
    if (!emailOtpRecord) throw new Error('No active email_verification OTP found in DB!');

    // Generate matching hash
    const crypto = require('crypto');
    // Let's test by finding which 6-digit matches the hash
    let actualOtp = '';
    for (let c = 100000; c <= 999999; c++) {
      if (crypto.createHash('sha256').update(String(c)).digest('hex') === emailOtpRecord.otpHash) {
        actualOtp = String(c);
        break;
      }
    }
    console.log(`Discovered active OTP for verification test: ${actualOtp}`);

    const verifyRes = await fetch(`${BASE_URL}/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: actualOtp }),
    });
    const verifyData = await verifyRes.json();
    console.log(`Status: ${verifyRes.status} | Verified: ${verifyData.success}`);

    const updatedUser = await User.findOne({ email: testEmail.toLowerCase() });
    if (verifyRes.status === 200 && updatedUser.isEmailVerified) {
      console.log('✅ PASS: Account email successfully verified in MongoDB.\n');
    } else {
      throw new Error('FAIL: Email verification failed!');
    }

    // -------------------------------------------------------------
    // Test 6: Reused OTP Rejection
    // -------------------------------------------------------------
    console.log('[6] Prevent OTP Reuse Check:');
    const reuseRes = await fetch(`${BASE_URL}/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: actualOtp }),
    });
    const reuseData = await reuseRes.json();
    console.log(`Status: ${reuseRes.status} | Message: "${reuseData.message}"`);
    if (reuseRes.status === 400) {
      console.log('✅ PASS: Reused OTP rejected successfully.\n');
    } else {
      throw new Error('FAIL: Reused OTP was accepted!');
    }

    // -------------------------------------------------------------
    // Test 7: Step 1 Login (Credentials Check & 2FA OTP Dispatch)
    // -------------------------------------------------------------
    console.log('[7] Step 1 Login (Valid Credentials):');
    const loginStep1Res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginStep1Data = await loginStep1Res.json();
    console.log(`Status: ${loginStep1Res.status} | Requires Login OTP: ${loginStep1Data.requiresLoginOtp}`);
    console.log(`TempToken Issued: ${loginStep1Data.tempToken ? 'Yes (Restricted)' : 'No'}`);
    if (loginStep1Res.status === 200 && loginStep1Data.requiresLoginOtp && loginStep1Data.tempToken && !loginStep1Data.token) {
      console.log('✅ PASS: Credentials validated; 2FA login OTP dispatched without granting full access.\n');
    } else {
      throw new Error('FAIL: Step 1 login failed or prematurely issued access token!');
    }

    // -------------------------------------------------------------
    // Test 8: Attempt Protected Access Using TempToken
    // -------------------------------------------------------------
    console.log('[8] TempToken Rejection on Protected APIs:');
    const tempAccessRes = await fetch(`${BASE_URL}/courses/student/enrolled`, {
      headers: { Authorization: `Bearer ${loginStep1Data.tempToken}` },
    });
    const tempAccessData = await tempAccessRes.json();
    console.log(`Status: ${tempAccessRes.status} | Code: ${tempAccessData.code}`);
    if (tempAccessRes.status === 401 && tempAccessData.code === 'LOGIN_OTP_PENDING') {
      console.log('✅ PASS: Incomplete 2FA tempToken blocked on protected resources.\n');
    } else {
      throw new Error('FAIL: TempToken was improperly allowed to access protected endpoints!');
    }

    // -------------------------------------------------------------
    // Test 9: Step 2 Login Verification (Correct Login OTP)
    // -------------------------------------------------------------
    console.log('[9] Step 2 Login (Valid 2FA Login OTP Verification):');
    const loginOtpRecord = await Otp.findOne({
      email: testEmail.toLowerCase(),
      purpose: 'login_verification',
      isUsed: false,
    });
    if (!loginOtpRecord) throw new Error('No active login_verification OTP found in DB!');

    let actualLoginOtp = '';
    for (let c = 100000; c <= 999999; c++) {
      if (crypto.createHash('sha256').update(String(c)).digest('hex') === loginOtpRecord.otpHash) {
        actualLoginOtp = String(c);
        break;
      }
    }
    console.log(`Discovered active Login OTP for test: ${actualLoginOtp}`);

    const loginStep2Res = await fetch(`${BASE_URL}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: actualLoginOtp,
        tempToken: loginStep1Data.tempToken,
      }),
    });
    const loginStep2Data = await loginStep2Res.json();
    console.log(`Status: ${loginStep2Res.status} | Access Token Issued: ${!!loginStep2Data.token}`);
    if (loginStep2Res.status === 200 && loginStep2Data.token) {
      console.log(`✅ PASS: Two-step login verified! Full JWT token issued for ${loginStep2Data.user.name}.\n`);
    } else {
      throw new Error('FAIL: Step 2 login OTP verification failed!');
    }

    // -------------------------------------------------------------
    // Test 10: Access Protected API with Authentic JWT
    // -------------------------------------------------------------
    console.log('[10] Access Protected Resource with Full JWT:');
    const authAccessRes = await fetch(`${BASE_URL}/courses/student/enrolled`, {
      headers: { Authorization: `Bearer ${loginStep2Data.token}` },
    });
    const authAccessData = await authAccessRes.json();
    console.log(`Status: ${authAccessRes.status} | Success: ${authAccessData.success}`);
    if (authAccessRes.status === 200 && authAccessData.success) {
      console.log('✅ PASS: Authenticated student successfully accesses protected private endpoints.\n');
    } else {
      throw new Error('FAIL: Valid JWT token was rejected!');
    }

    // -------------------------------------------------------------
    // Test 11: Resend OTP Cooldown Enforcement
    // -------------------------------------------------------------
    console.log('[11] Resend OTP 60-Second Cooldown Enforcement:');
    const resendCooldownRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, purpose: 'login_verification' }),
    });
    const resendCooldownData = await resendCooldownRes.json();
    console.log(`Status: ${resendCooldownRes.status} | Message: "${resendCooldownData.message}"`);
    if (resendCooldownRes.status === 429) {
      console.log(`✅ PASS: Rate limit prevented spamming. Remaining cooldown: ${resendCooldownData.cooldownRemaining}s.\n`);
    } else {
      throw new Error('FAIL: Resend cooldown was not enforced!');
    }

    // -------------------------------------------------------------
    // Test 12: Password Reset via 6-Digit OTP
    // -------------------------------------------------------------
    console.log('[12] Forgot Password & Reset via 6-Digit OTP:');
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    console.log(`Status: ${forgotRes.status} | Message: "${forgotData.message}"`);

    const resetOtpRecord = await Otp.findOne({
      email: testEmail.toLowerCase(),
      purpose: 'password_reset',
      isUsed: false,
    });
    if (!resetOtpRecord) throw new Error('No password_reset OTP found!');

    let actualResetOtp = '';
    for (let c = 100000; c <= 999999; c++) {
      if (crypto.createHash('sha256').update(String(c)).digest('hex') === resetOtpRecord.otpHash) {
        actualResetOtp = String(c);
        break;
      }
    }

    const newPassword = 'NewSecretPassword2026!';
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: actualResetOtp, password: newPassword }),
    });
    const resetData = await resetRes.json();
    console.log(`Status: ${resetRes.status} | Message: "${resetData.message}"`);
    if (resetRes.status === 200 && resetData.success) {
      console.log('✅ PASS: Password successfully reset with OTP.\n');
    } else {
      throw new Error('FAIL: Password reset failed!');
    }

    console.log('================================================================');
    console.log('🎉 ALL 12 AUTHENTICATION & SECURITY SCENARIOS PASSED 100%!');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
  } finally {
    // Clean up test user & OTP records
    await User.deleteOne({ email: testEmail.toLowerCase() });
    await Otp.deleteMany({ email: testEmail.toLowerCase() });
    await mongoose.disconnect();
  }
}

runAuthTests();

