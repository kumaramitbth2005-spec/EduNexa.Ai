const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generatePractice,
  submitPractice,
  getSessions,
  getSessionDetail,
  getAnalytics,
  trackTopicActivity,
} = require('../controllers/practiceController');

// All practice endpoints require authentication
router.use(protect);

router.post('/generate', generatePractice);
router.get('/sessions', getSessions);
router.get('/analytics', getAnalytics);
router.post('/track-activity', trackTopicActivity);
router.get('/:id', getSessionDetail);
router.post('/:id/submit', submitPractice);

module.exports = router;

