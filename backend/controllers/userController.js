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
    const allowedFields = ['name', 'bio', 'phone', 'college', 'branch', 'semester', 'skills', 'socialLinks', 'preferredLanguage', 'darkMode', 'notificationPrefs'];
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

    // Remove old avatar from cloudinary
    const user = await User.findById(req.user.id);
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.path },
      { new: true }
    );

    res.status(200).json({ success: true, user: updatedUser, avatarUrl: req.file.path });
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

