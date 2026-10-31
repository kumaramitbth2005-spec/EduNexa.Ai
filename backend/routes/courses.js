const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  enrollCourse, getCourseProgress, completeLesson, getTeacherCourses, getEnrolledCourses
} = require('../controllers/courseController');
const { uploadMaterial } = require('../config/cloudinary');

router.get('/', optionalAuth, getCourses);
router.get('/teacher/my-courses', protect, authorize('teacher', 'admin'), getTeacherCourses);
router.get('/student/enrolled', protect, getEnrolledCourses);
router.get('/:id', optionalAuth, getCourse);
router.post('/', protect, authorize('teacher', 'admin'), uploadMaterial.single('thumbnail'), createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), uploadMaterial.single('thumbnail'), updateCourse);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);
router.post('/:id/enroll', protect, enrollCourse);
router.get('/:id/progress', protect, getCourseProgress);
router.post('/:id/lessons/:lessonId/complete', protect, completeLesson);

module.exports = router;

