const express = require('express');
const router = express.Router();
const { optionalAuth, protect, authorize } = require('../middleware/auth');
const {
  getSubjectNotes,
  getSubjectHierarchy,
  getSubjectNoteById,
  updateNoteProgress,
  createSubjectNote,
  updateSubjectNote,
} = require('../controllers/subjectNotesController');

router.get('/', optionalAuth, getSubjectNotes);
router.get('/hierarchy', optionalAuth, getSubjectHierarchy);
router.get('/:id', optionalAuth, getSubjectNoteById);
router.post('/:id/progress', protect, updateNoteProgress);
router.post('/', protect, authorize('teacher', 'admin'), createSubjectNote);
router.put('/:id', protect, authorize('teacher', 'admin'), updateSubjectNote);

module.exports = router;

