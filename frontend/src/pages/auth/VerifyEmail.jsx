import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, MailCheck, ArrowRight, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmailOtp, resendOtp } = useAuth();

  const queryEmail = searchParams.get('email') || '';
  const stateEmail = location.state?.email || '';
  const initialEmail = stateEmail || queryEmail;
  const initialDelivered = location.state?.emailDelivered !== false;
  const initialServerMessage = location.state?.serverMessage || '';

  const [email, setEmail] = useState(initialEmail);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDelivered, setEmailDelivered] = useState(initialDelivered);
  const [serverNotice, setServerNotice] = useState(initialServerMessage);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins

  const inputRefs = useRef([]);

  // 5-minute expiry timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 60-second resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      const nextOtp = [...otp];
      chars.forEach((c, idx) => {
        if (index + idx < 6) nextOtp[index + idx] = c;
      });
      setOtp(nextOtp);
      const focusIndex = Math.min(index + chars.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = cleanVal[0];
    setOtp(nextOtp);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullOtp = otp.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email address is required.');
      return;
    }
    if (fullOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmailOtp({
        email,
        otp: fullOtp,
      });

      toast.success(res.message || 'Email verified successfully!');
      // Navigate to dashboard if token issued, or login
      if (res.token) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;
    try {
      setResending(true);
      const res = await resendOtp({ email, purpose: 'email_verification' });
      toast.success(res.message || 'A fresh verification code has been dispatched to your email.');
      setEmailDelivered(true);
      setServerNotice('');
      setCooldown(60);
      setTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="card w-full max-w-md p-8 shadow-2xl border border-gray-100 dark:border-gray-800 backdrop-blur-xl">
        {/* Brand & Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              EduNexa
            </span>
          </Link>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto mb-2">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            We sent a 6-digit confirmation code to your inbox.
          </p>
        </div>

        {/* Email input (if not provided in state) */}
        {!initialEmail ? (
          <div className="mb-4">
            <label className="label">Registered Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="input pl-10"
                required
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">
              <span>Verification Code Sent To:</span>
              <button
                type="button"
                onClick={() => setEditingEmail((prev) => !prev)}
                className="hover:underline font-semibold"
              >
                {editingEmail ? 'Done' : 'Change'}
              </button>
            </div>
            {editingEmail ? (
              <div className="flex gap-2 mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input py-1 text-xs"
                  placeholder="Enter correct email"
                />
                <button
                  type="button"
                  onClick={() => setEditingEmail(false)}
                  className="btn-primary text-xs px-3 py-1"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-primary-900 dark:text-primary-200 text-center">{email}</p>
            )}
          </div>
        )}

        {/* Notice if email delivery failed */}
        {!emailDelivered && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️ Verification Email Status:</span>
            </p>
            <p className="mt-1 leading-relaxed opacity-90">
              {serverNotice || 'Email could not be delivered to your inbox. Check server SMTP settings or click "Resend Code" below.'}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 text-center mb-3">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
          </div>

          {/* Expiry & Resend */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
            <span>
              Expires in:{' '}
              <strong className={timeLeft < 60 ? 'text-rose-500' : 'text-gray-800 dark:text-gray-200'}>
                {formatTime(timeLeft)}
              </strong>
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending || !email}
              className={`font-semibold inline-flex items-center gap-1 ${
                cooldown > 0
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'text-primary-600 dark:text-primary-400 hover:underline'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || fullOtp.length !== 6 || timeLeft <= 0}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Account...</span>
              </>
            ) : (
              <>
                <span>Confirm & Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
