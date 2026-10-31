const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

// @GET /api/notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    const total = await Notification.countDocuments({ recipient: req.user.id });
    res.status(200).json({ success: true, total, unreadCount, notifications });
  } catch (error) {
    next(error);
  }
});

// @PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// @PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { isRead: true, readAt: new Date() });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// @DELETE /api/notifications/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

