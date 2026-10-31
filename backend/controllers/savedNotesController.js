/**
 * savedNotesController.js
 * CRUD for SavedNote — notes saved from AI tutor, documents, or manually.
 */

const SavedNote = require('../models/SavedNote');

// @GET /api/notes
exports.getNotes = async (req, res, next) => {
  try {
    const { tag, subject, pinned, page = 1, limit = 30 } = req.query;
    const filter = { user: req.user.id };
    if (tag) filter.tags = tag;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (pinned === 'true') filter.isPinned = true;

    const notes = await SavedNote.find(filter)
      .sort('-isPinned -createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await SavedNote.countDocuments(filter);
    res.status(200).json({ success: true, total, notes });
  } catch (error) {
    next(error);
  }
};

// @POST /api/notes
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, tags, subject, source, conversationId, documentId, isPinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required.' });
    }

    const note = await SavedNote.create({
      user: req.user.id,
      title,
      content,
      tags: tags || [],
      subject: subject || '',
      source: source || 'manual',
      conversationId: conversationId || null,
      documentId: documentId || null,
      isPinned: isPinned || false,
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/notes/:id
exports.updateNote = async (req, res, next) => {
  try {
    const note = await SavedNote.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.status(200).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/notes/:id
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await SavedNote.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.status(200).json({ success: true, message: 'Note deleted.' });
  } catch (error) {
    next(error);
  }
};

// @GET /api/notes/:id
exports.getNote = async (req, res, next) => {
  try {
    const note = await SavedNote.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.status(200).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

