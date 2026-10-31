const SubjectNote = require('../models/SubjectNote');
const TopicProgress = require('../models/TopicProgress');

// @GET /api/subject-notes
exports.getSubjectNotes = async (req, res, next) => {
  try {
    const { degree, branch, semester, subject, unit, search, page = 1, limit = 50 } = req.query;
    const query = { isPublished: true };

    if (degree) query.degree = new RegExp(`^${degree}$`, 'i');
    if (branch) query.branch = new RegExp(branch, 'i');
    if (semester) query.semester = Number(semester);
    if (subject) query.subject = new RegExp(subject, 'i');
    if (unit) query.unit = new RegExp(unit, 'i');
    if (search) {
      query.$or = [
        { topic: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { unit: new RegExp(search, 'i') },
        { keyConcepts: new RegExp(search, 'i') },
      ];
    }

    const notes = await SubjectNote.find(query)
      .select('degree branch semester subject subjectCode unit topic order introduction keyConcepts viewsCount createdAt')
      .sort('semester subject unit order')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await SubjectNote.countDocuments(query);

    // Fetch user bookmarks/progress if logged in
    let userProgress = {};
    if (req.user) {
      const progressDocs = await TopicProgress.find({
        user: req.user.id,
        type: 'subject_note',
      });
      progressDocs.forEach((p) => {
        userProgress[p.topicId] = { completed: p.completed, bookmarked: p.bookmarked };
      });
    }

    res.status(200).json({ success: true, total, notes, userProgress });
  } catch (error) {
    next(error);
  }
};

// @GET /api/subject-notes/hierarchy
exports.getSubjectHierarchy = async (req, res, next) => {
  try {
    const subjects = await SubjectNote.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: {
            degree: '$degree',
            branch: '$branch',
            semester: '$semester',
            subject: '$subject',
            subjectCode: '$subjectCode',
          },
          topicCount: { $sum: 1 },
          units: { $addToSet: '$unit' },
        },
      },
      {
        $project: {
          _id: 0,
          degree: '$_id.degree',
          branch: '$_id.branch',
          semester: '$_id.semester',
          subject: '$_id.subject',
          subjectCode: '$_id.subjectCode',
          topicCount: 1,
          units: 1,
        },
      },
      { $sort: { semester: 1, subject: 1 } },
    ]);

    res.status(200).json({ success: true, hierarchy: subjects });
  } catch (error) {
    next(error);
  }
};

// @GET /api/subject-notes/:id
exports.getSubjectNoteById = async (req, res, next) => {
  try {
    const note = await SubjectNote.findById(req.params.id).populate('createdBy', 'name college avatar');
    if (!note) return res.status(404).json({ success: false, message: 'Study note not found.' });

    // Increment views
    note.viewsCount = (note.viewsCount || 0) + 1;
    await note.save();

    // Check user progress
    let progress = { completed: false, bookmarked: false };
    if (req.user) {
      const p = await TopicProgress.findOne({
        user: req.user.id,
        type: 'subject_note',
        topicId: note._id.toString(),
      });
      if (p) progress = { completed: p.completed, bookmarked: p.bookmarked };
    }

    // Get sibling topics in the same unit
    const siblingTopics = await SubjectNote.find({
      subject: note.subject,
      unit: note.unit,
      isPublished: true,
    })
      .select('topic order _id')
      .sort('order');

    res.status(200).json({ success: true, note, progress, siblingTopics });
  } catch (error) {
    next(error);
  }
};

// @POST /api/subject-notes/:id/progress
exports.updateNoteProgress = async (req, res, next) => {
  try {
    const { completed, bookmarked } = req.body;
    const noteId = req.params.id;

    const note = await SubjectNote.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    const update = { lastStudiedAt: new Date() };
    if (completed !== undefined) {
      update.completed = completed;
      if (completed) update.completedAt = new Date();
    }
    if (bookmarked !== undefined) update.bookmarked = bookmarked;

    const p = await TopicProgress.findOneAndUpdate(
      { user: req.user.id, type: 'subject_note', topicId: noteId },
      update,
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, progress: p });
  } catch (error) {
    next(error);
  }
};

// @POST /api/subject-notes (Admin / Teacher only)
exports.createSubjectNote = async (req, res, next) => {
  try {
    const note = await SubjectNote.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/subject-notes/:id (Admin / Teacher only)
exports.updateSubjectNote = async (req, res, next) => {
  try {
    const note = await SubjectNote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.status(200).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};
