const express = require('express');
const router = express.Router();
const { optionalAuth, protect } = require('../middleware/auth');
const {
  getModules,
  getTopics,
  getTopicDetail,
  updateTopicProgress,
} = require('../controllers/dsaController');

router.get('/modules', optionalAuth, getModules);
router.get('/topics', optionalAuth, getTopics);
router.get('/topics/:topicId', optionalAuth, getTopicDetail);
router.post('/topics/:topicId/progress', protect, updateTopicProgress);

module.exports = router;
