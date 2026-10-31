/**
 * syllabusController.js
 * Manages academic syllabi — admins/teachers create, students query.
 */

const Syllabus = require('../models/Syllabus');

// @GET /api/syllabi — query by degree/branch/semester/subject
exports.getSyllabi = async (req, res, next) => {
  try {
    const { degree, branch, semester, subject } = req.query;
    const filter = { isActive: true };
    if (degree) filter.degree = new RegExp(degree, 'i');
    if (branch) filter.branch = new RegExp(branch, 'i');
    if (semester) filter.semester = Number(semester);
    if (subject) filter.subject = new RegExp(subject, 'i');

    const syllabi = await Syllabus.find(filter)
      .select('-topics.subtopics') // shorter list response
      .sort('subject')
      .limit(50);

    res.status(200).json({ success: true, syllabi });
  } catch (error) {
    next(error);
  }
};

// @GET /api/syllabi/:id
exports.getSyllabus = async (req, res, next) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) return res.status(404).json({ success: false, message: 'Syllabus not found.' });
    res.status(200).json({ success: true, syllabus });
  } catch (error) {
    next(error);
  }
};

// @POST /api/syllabi — admin/teacher only
exports.createSyllabus = async (req, res, next) => {
  try {
    const { subject, subjectCode, degree, branch, semester, university, topics, version } = req.body;

    if (!subject || !degree || !branch || !semester) {
      return res.status(400).json({ success: false, message: 'subject, degree, branch, semester are required.' });
    }

    const syllabus = await Syllabus.create({
      subject,
      subjectCode: subjectCode || '',
      degree,
      branch,
      semester: Number(semester),
      university: university || 'General',
      topics: topics || [],
      version: version || '1.0',
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, syllabus });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/syllabi/:id — admin/teacher only
exports.updateSyllabus = async (req, res, next) => {
  try {
    const syllabus = await Syllabus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!syllabus) return res.status(404).json({ success: false, message: 'Syllabus not found.' });
    res.status(200).json({ success: true, syllabus });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/syllabi/:id — admin only
exports.deleteSyllabus = async (req, res, next) => {
  try {
    await Syllabus.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Syllabus deactivated.' });
  } catch (error) {
    next(error);
  }
};

