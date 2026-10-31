const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNotes, createNote, updateNote, deleteNote, getNote } = require('../controllers/savedNotesController');

router.use(protect);

router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;

