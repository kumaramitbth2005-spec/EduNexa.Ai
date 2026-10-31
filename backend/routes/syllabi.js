const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSyllabi, getSyllabus, createSyllabus, updateSyllabus, deleteSyllabus } = require('../controllers/syllabusController');

router.get('/', protect, getSyllabi);
router.get('/:id', protect, getSyllabus);
router.post('/', protect, authorize('admin', 'teacher'), createSyllabus);
router.put('/:id', protect, authorize('admin', 'teacher'), updateSyllabus);
router.delete('/:id', protect, authorize('admin'), deleteSyllabus);

module.exports = router;

