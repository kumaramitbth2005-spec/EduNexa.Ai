const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCourseAssignments,
  getAssignment,
  submitAssignment,
} = require('../controllers/assignmentController');

router.get('/course/:courseId', protect, getCourseAssignments);
router.get('/:id', protect, getAssignment);
router.post('/:id/submit', protect, submitAssignment);

module.exports = router;
