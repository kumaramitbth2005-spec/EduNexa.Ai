const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Result = require('../models/Result');
const { cloudinary } = require('../config/cloudinary');

// @GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'bio', 'phone', 'college', 'branch', 'semester',
      'degree', 'educationLevel', 'learningGoals', 'availableStudyHoursPerDay',
      'skills', 'socialLinks', 'preferredLanguage', 'darkMode', 'notificationPrefs'
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Determine avatar URL: Cloudinary URL or local static URL
    let avatarUrl = req.file.path;
    if (!avatarUrl || !avatarUrl.startsWith('http')) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    }

    // Remove old avatar if locally stored or on Cloudinary
    const user = await User.findById(req.user.id);
    if (user.avatar) {
      try {
        if (user.avatar.includes('cloudinary') && cloudinary) {
          const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        } else if (user.avatar.includes('/uploads/avatars/')) {
          const oldFilename = user.avatar.split('/uploads/avatars/').pop();
          const oldPath = path.join(__dirname, '../uploads/avatars', oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (_) {}
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({ success: true, user: updatedUser, avatarUrl });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/users/avatar
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.avatar) {
      try {
        if (user.avatar.includes('cloudinary') && cloudinary) {
          const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        } else if (user.avatar.includes('/uploads/avatars/')) {
          const oldFilename = user.avatar.split('/uploads/avatars/').pop();
          const oldPath = path.join(__dirname, '../uploads/avatars', oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (_) {}
    }

    user.avatar = '';
    await user.save();

    res.status(200).json({ success: true, message: 'Profile picture removed successfully.', user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// @GET /api/users/dashboard-stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [enrollments, results, user] = await Promise.all([
      Enrollment.find({ student: userId }).populate('course', 'title thumbnail category').sort('-lastAccessedAt').limit(5),
      Result.find({ student: userId }).sort('-submittedAt').limit(5).populate('exam', 'title totalMarks'),
      User.findById(userId),
    ]);

    const totalEnrolled = await Enrollment.countDocuments({ student: userId });
    const completed = await Enrollment.countDocuments({ student: userId, isCompleted: true });
    const avgScore = results.length
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalEnrolled,
        completed,
        inProgress: totalEnrolled - completed,
        studyStreak: user.studyStreak,
        totalPoints: user.totalPoints,
        badges: user.badges,
        avgScore,
      },
      recentCourses: enrollments,
      recentResults: results,
    });
  } catch (error) {
    next(error);
  }
};

// ---- ADMIN ONLY ----

// @GET /api/users (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({ success: true, total, page: Number(page), users });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/:id/status (admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/users/:id (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};

// @GET /api/users/admin/stats
exports.getAdminStats = async (req, res, next) => {
  try {
    const [totalStudents, totalTeachers, totalAdmins, newUsersThisMonth] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } }),
    ]);

    res.status(200).json({
      success: true,
      stats: { totalStudents, totalTeachers, totalAdmins, newUsersThisMonth },
    });
  } catch (error) {
    next(error);
  }
};

