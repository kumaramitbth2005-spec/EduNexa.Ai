const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getExams, getExam, createExam, updateExam, deleteExam,
  submitExam, getExamResults, getStudentExamHistory
} = require('../controllers/examController');

router.get('/', protect, getExams);
router.get('/student/history', protect, getStudentExamHistory);
router.get('/:id', protect, getExam);
router.post('/', protect, authorize('teacher', 'admin'), createExam);
router.put('/:id', protect, authorize('teacher', 'admin'), updateExam);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteExam);
router.post('/:id/submit', protect, submitExam);
router.get('/:id/results', protect, getExamResults);

module.exports = router;

