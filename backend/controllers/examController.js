const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Enrollment = require('../models/Enrollment');

// @GET /api/exams
exports.getExams = async (req, res, next) => {
  try {
    const { course, type, page = 1, limit = 20 } = req.query;
    const query = { isPublished: true };
    if (course) query.course = course;
    if (type) query.type = type;

    const exams = await Exam.find(query)
      .select('-questions')
      .populate('createdBy', 'name')
      .populate('course', 'title')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Exam.countDocuments(query);
    res.status(200).json({ success: true, total, exams });
  } catch (error) {
    next(error);
  }
};

// @GET /api/exams/:id (safe — no answers)
exports.getExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('createdBy', 'name').populate('course', 'title');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    if (!exam.isPublished && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Exam not available.' });
    }

    // Check attempt limit
    const attemptCount = await Result.countDocuments({ student: req.user.id, exam: exam._id });
    if (attemptCount >= exam.attemptLimit) {
      return res.status(400).json({ success: false, message: 'Attempt limit reached.', canRetake: false, attemptCount });
    }

    // Return safe questions (no correct answers)
    const safeExam = exam.toObject();
    safeExam.questions = exam.getSafeQuestions();

    res.status(200).json({ success: true, exam: safeExam, attemptCount, canRetake: true });
  } catch (error) {
    next(error);
  }
};

// @POST /api/exams
exports.createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, exam });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/exams/:id
exports.updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, exam: updated });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/exams/:id
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Exam deleted.' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/exams/:id/submit — server-side evaluation
exports.submitExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    // Check attempt limit
    const attemptCount = await Result.countDocuments({ student: req.user.id, exam: exam._id });
    if (attemptCount >= exam.attemptLimit) {
      return res.status(400).json({ success: false, message: 'Attempt limit reached.' });
    }

    const { answers, timeTaken, startedAt } = req.body;
    let obtainedMarks = 0;
    const evaluatedAnswers = [];

    exam.questions.forEach((question) => {
      const studentAnswer = answers.find((a) => a.question.toString() === question._id.toString());
      let isCorrect = false;
      let marksObtained = 0;

      if (question.type === 'mcq' || question.type === 'true-false') {
        if (studentAnswer && studentAnswer.selectedOption) {
          const correctOption = question.options.find((o) => o.isCorrect);
          isCorrect = correctOption && correctOption._id.toString() === studentAnswer.selectedOption.toString();
          if (isCorrect) marksObtained = question.marks;
        }
      } else {
        // For short/long — teacher evaluates, give 0 for now
        marksObtained = 0;
        isCorrect = null;
      }

      obtainedMarks += marksObtained;
      evaluatedAnswers.push({
        question: question._id,
        selectedOption: studentAnswer?.selectedOption,
        textAnswer: studentAnswer?.textAnswer,
        codeAnswer: studentAnswer?.codeAnswer,
        isCorrect,
        marksObtained,
      });
    });

    const percentage = Math.round((obtainedMarks / exam.totalMarks) * 100);
    const isPassed = obtainedMarks >= exam.passingMarks;

    const result = await Result.create({
      student: req.user.id,
      exam: exam._id,
      answers: evaluatedAnswers,
      totalMarks: exam.totalMarks,
      obtainedMarks,
      percentage,
      isPassed,
      timeTaken,
      attemptNumber: attemptCount + 1,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      status: 'submitted',
    });

    // Return answers with explanations if allowed
    let resultData = result.toObject();
    if (exam.showResultImmediately) {
      resultData.questionsWithAnswers = exam.questions.map((q) => ({
        _id: q._id,
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks,
      }));
    }

    res.status(201).json({ success: true, result: resultData, isPassed, percentage, obtainedMarks });
  } catch (error) {
    next(error);
  }
};

// @GET /api/exams/:id/results
exports.getExamResults = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    // Students can only see their own results
    let query = { exam: exam._id };
    if (req.user.role === 'student') query.student = req.user.id;

    const results = await Result.find(query)
      .populate('student', 'name avatar email')
      .sort('-submittedAt');

    res.status(200).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// @GET /api/exams/student/history
exports.getStudentExamHistory = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.user.id })
      .populate('exam', 'title totalMarks duration type')
      .sort('-submittedAt')
      .limit(20);
    res.status(200).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

