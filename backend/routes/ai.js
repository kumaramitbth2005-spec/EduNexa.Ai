const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chat, summarizePDF, generateQuestions, generateStudyPlan, translate, getConversations, getConversation, deleteConversation } = require('../controllers/aiController');

router.post('/chat', protect, chat);
router.post('/summarize', protect, summarizePDF);
router.post('/generate-questions', protect, generateQuestions);
router.post('/study-plan', protect, generateStudyPlan);
router.post('/translate', protect, translate);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversation);
router.delete('/conversations/:id', protect, deleteConversation);

module.exports = router;

