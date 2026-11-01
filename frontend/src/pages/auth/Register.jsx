import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    college: '',
    branch: '',
    semester: 1,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please accept the EduNexa Terms & Privacy Policy to register.');
      return;
    }

    try {
      setLoading(true);
      const res = await register(formData);

      if (res.token && res.user) {
        toast.success(`Account created! Welcome, ${res.user.name}`);
        navigate('/dashboard', { replace: true });
        return;
      }

      toast.success(res.message || 'Registration successful! Verification code sent to your email.');

      // Redirect immediately to email verification OTP page
      navigate('/verify-email', {
        state: { email: formData.email.toLowerCase().trim() },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="card w-full max-w-xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 backdrop-blur-xl">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              EduNexa
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Join thousands of students and educators mastering modern technology
          </p>
        </div>

        {/* Security Banner */}
        <div className="mb-6 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-900/50 flex items-center gap-2.5 text-xs text-primary-800 dark:text-primary-300">
          <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <span>A 6-digit confirmation code will be sent to verify your Gmail address.</span>
        </div>

        {/* Role toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, role: 'student' }))}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              formData.role === 'student'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            I am a Student
          </button>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, role: 'teacher' }))}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              formData.role === 'teacher'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            I am an Educator
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Aarav Patel"
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Gmail / Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@gmail.com"
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Password (min 8 chars)</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">College / University</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="National Institute of Technology"
                className="input"
              />
            </div>
            <div>
              <label className="label">Branch / Department</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="Computer Science & Engg."
                className="input"
              />
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                I agree to the EduNexa <span className="text-primary-600 dark:text-primary-400 font-semibold">Terms of Service</span> and acknowledge the Privacy Policy.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 mt-4"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account & Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Create Account & Verify Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
