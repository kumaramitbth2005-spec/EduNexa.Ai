import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services';
import { GraduationCap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset link sent if account exists');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="card w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/60 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter your registered email and we'll send you instructions to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Check Your Inbox</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If an account with <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span> exists,
              we have sent a reset password link valid for 30 minutes.
            </p>
            <Link to="/login" className="btn-secondary w-full inline-block mt-4 text-center">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Registered Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

