import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ShieldCheck, ArrowRight, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyLoginOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyLoginOtp, resendOtp } = useAuth();

  const email = location.state?.email || '';
  const tempToken = location.state?.tempToken || '';
  const from = location.state?.from || null;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  const inputRefs = useRef([]);

  // Redirect to login if opened without email
  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please sign in again.');
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // 5-minute overall expiry countdown
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
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    // Handle multi-character paste (e.g. pasted 6-digit code)
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

    // Auto-advance to next box
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
    if (fullOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyLoginOtp({
        email,
        otp: fullOtp,
        tempToken,
      });

      toast.success(res.message || 'Login verified successfully!');

      // Redirect to originally requested protected route or role dashboard
      if (from?.pathname) {
        navigate(from.pathname + (from.search || ''), { replace: true });
      } else if (res.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (res.user?.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    try {
      setResending(true);
      const res = await resendOtp({ email, purpose: 'login_verification' });
      toast.success(res.message || 'A fresh verification code has been dispatched.');
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

  // Mask email for display: am***@domain.com
  const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str;
    const [name, domain] = str.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="card w-full max-w-md p-8 shadow-2xl border border-gray-100 dark:border-gray-800 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/30 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Two-Step Verification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            For security, enter the 6-digit code sent to:
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-700 dark:text-primary-300">
            <Mail className="w-3.5 h-3.5" />
            <span>{maskEmail(email)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 text-center mb-3">
              Enter 6-Digit Code
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
              disabled={cooldown > 0 || resending}
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
                <span>Verifying Security Code...</span>
              </>
            ) : (
              <>
                <span>Complete Sign In</span>
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
            <span>Sign in with a different account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
