const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: { type: String, maxlength: 500, default: '' },
    phone: { type: String, default: '' },
    college: { type: String, default: '' },
    branch: { type: String, default: '' },
    semester: { type: Number, min: 1, max: 8, default: 1 },
    degree: { type: String, default: '' }, // e.g., "B.Tech", "BCA", "MCA"
    educationLevel: { type: String, enum: ['school', 'undergraduate', 'postgraduate', 'other'], default: 'undergraduate' },
    learningGoals: { type: String, default: '' }, // e.g., "Crack GATE, Get placement at FAANG"
    availableStudyHoursPerDay: { type: Number, min: 0.5, max: 12, default: 2 },
    skills: [{ type: String }],
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailVerifyToken: String,
    emailVerifyExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    studyStreak: { type: Number, default: 0 },
    lastStudyDate: Date,
    totalPoints: { type: Number, default: 0 },
    badges: [{ type: String }],
    preferredLanguage: { type: String, enum: ['en', 'hi'], default: 'en' },
    darkMode: { type: Boolean, default: false },
    notificationPrefs: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

// Generate email verify token
userSchema.methods.getEmailVerifyToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return token;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30min
  return token;
};

// Update study streak
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = this.lastStudyDate ? new Date(this.lastStudyDate) : null;
  if (lastDate) lastDate.setHours(0, 0, 0, 0);
  if (!lastDate || lastDate.getTime() !== today.getTime()) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate && lastDate.getTime() === yesterday.getTime()) {
      this.studyStreak += 1;
    } else if (!lastDate || lastDate.getTime() < yesterday.getTime()) {
      this.studyStreak = 1;
    }
    this.lastStudyDate = today;
  }
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);

