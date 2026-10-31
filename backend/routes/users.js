const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile, updateProfile, uploadAvatar, changePassword,
  getDashboardStats, getAllUsers, toggleUserStatus, deleteUser, getAdminStats
} = require('../controllers/userController');
const { uploadProfile } = require('../config/cloudinary');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, uploadProfile.single('avatar'), uploadAvatar);
router.put('/change-password', protect, changePassword);
router.get('/dashboard-stats', protect, getDashboardStats);

// Admin routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);
router.put('/:id/status', protect, authorize('admin'), toggleUserStatus);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;

