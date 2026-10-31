const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getCourseProgress,
  completeLesson,
  getTeacherCourses,
  getEnrolledCourses,
  getCourseCurriculum,
  getEnrollmentDetails,
  getLessonDetails,
} = require('../controllers/courseController');
const { getCourseAssignments } = require('../controllers/assignmentController');
const {
  getCourseAssessment,
  submitCourseAssessment,
  getAssessmentResult,
} = require('../controllers/courseAssessmentController');
const {
  checkCertificateEligibility,
  generateCertificate,
} = require('../controllers/certificateController');
const { uploadMaterial } = require('../config/cloudinary');

router.get('/', optionalAuth, getCourses);
router.get('/teacher/my-courses', protect, authorize('teacher', 'admin'), getTeacherCourses);
router.get('/student/enrolled', protect, getEnrolledCourses);
router.get('/:id', optionalAuth, getCourse);
router.get('/:id/curriculum', optionalAuth, getCourseCurriculum);
router.get('/:id/enrollment', protect, getEnrollmentDetails);
router.get('/:id/lessons/:lessonId', optionalAuth, getLessonDetails);
router.get('/:id/assignments', protect, getCourseAssignments);
router.get('/:id/assessment', protect, getCourseAssessment);
router.post('/:id/assessment/submit', protect, submitCourseAssessment);
router.get('/:id/assessment/result', protect, getAssessmentResult);
router.get('/:id/certificate/eligibility', protect, checkCertificateEligibility);
router.post('/:id/certificate/generate', protect, generateCertificate);
router.post('/', protect, authorize('teacher', 'admin'), uploadMaterial.single('thumbnail'), createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), uploadMaterial.single('thumbnail'), updateCourse);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);
router.post('/:id/enroll', protect, enrollCourse);
router.get('/:id/progress', protect, getCourseProgress);
router.post('/:id/lessons/:lessonId/complete', protect, completeLesson);

module.exports = router;

