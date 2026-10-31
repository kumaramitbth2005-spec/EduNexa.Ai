const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @GET /api/courses/:courseId/assessment
exports.getCourseAssessment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    let exam = await Exam.findOne({ course: course._id, type: 'mcq', isPublished: true });
    if (!exam) {
      // Find any published exam for this course
      exam = await Exam.findOne({ course: course._id, isPublished: true });
    }

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Comprehensive 50-Question MCQ Assessment is currently being prepared for this course.',
      });
    }

    // Check student's previous results
    let latestResult = null;
    let attemptCount = 0;
    if (req.user) {
      const results = await Result.find({ exam: exam._id, student: req.user.id })
        .sort('-submittedAt');
      attemptCount = results.length;
      if (results.length > 0) {
        latestResult = results[0];
      }
    }

    // Return safe questions without exposing correct answers
    const safeQuestions = exam.getSafeQuestions();

    res.status(200).json({
      success: true,
      assessment: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        courseId: course._id,
        courseTitle: course.title,
        durationMinutes: exam.duration || 60,
        totalQuestions: safeQuestions.length,
        totalMarks: exam.totalMarks || safeQuestions.length,
        passingMarks: exam.passingMarks || 35,
        passingPercentage: Math.round(((exam.passingMarks || 35) / (exam.totalMarks || 50)) * 100),
        instructions: exam.instructions?.length > 0 ? exam.instructions : [
          'This is the mandatory final comprehensive certification assessment for the course.',
          'Contains exactly 50 objective multiple-choice questions covering all modules.',
          'A minimum score of 70% (35/50) is required for verified course certification.',
          'Each question has 4 options with exactly one correct answer.',
          'You may flag questions for review and navigate freely using the question palette.',
        ],
        questions: safeQuestions,
      },
      userStatus: {
        attemptCount,
        hasAttempted: attemptCount > 0,
        hasPassed: latestResult?.isPassed || false,
        latestScore: latestResult?.obtainedMarks || null,
        latestPercentage: latestResult?.percentage || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/courses/:courseId/assessment/submit
exports.submitCourseAssessment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const exam = await Exam.findOne({ course: course._id, isPublished: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    const { answers = {}, timeTaken = 0 } = req.body;

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const topicStats = {};
    const detailedAnswers = [];
    const reviewQuestions = [];

    // Authoritative backend evaluation
    exam.questions.forEach((q) => {
      const qIdStr = q._id.toString();
      const selectedOptId = answers[qIdStr] ? String(answers[qIdStr]) : null;
      const topic = q.topic || 'General Concepts';

      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0, accuracy: 0 };
      }
      topicStats[topic].total += 1;

      let isCorrect = false;
      let marksObtained = 0;

      const correctOption = q.options.find((o) => o.isCorrect);
      const correctOptionId = correctOption ? correctOption._id.toString() : null;

      if (!selectedOptId) {
        unansweredCount++;
      } else if (correctOptionId && selectedOptId === correctOptionId) {
        isCorrect = true;
        correctCount++;
        marksObtained = q.marks || 1;
        topicStats[topic].correct += 1;
      } else {
        incorrectCount++;
      }

      detailedAnswers.push({
        question: q._id,
        selectedOption: selectedOptId,
        isCorrect,
        marksObtained,
      });

      // Prepare comprehensive post-submission review
      reviewQuestions.push({
        _id: q._id,
        text: q.text,
        topic: q.topic,
        difficulty: q.difficulty,
        options: q.options.map((o) => ({
          _id: o._id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
        correctOptionId,
        selectedOptionId: selectedOptId,
        isCorrect,
        explanation: q.explanation || 'Refer to course lessons for detailed theoretical derivations.',
      });
    });

    const totalQuestions = exam.questions.length;
    const totalMarks = exam.totalMarks || totalQuestions;
    const percentage = totalMarks > 0 ? Math.round((correctCount / totalMarks) * 100) : 0;
    const isPassed = percentage >= (exam.passingMarks ? Math.round((exam.passingMarks / totalMarks) * 100) : 70);

    // Calculate topic-wise accuracy & weak areas
    const topicAnalysis = Object.keys(topicStats).map((t) => {
      const s = topicStats[t];
      const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
      return {
        topic: t,
        total: s.total,
        correct: s.correct,
        accuracy: acc,
        isWeak: acc < 60,
      };
    });

    const weakTopics = topicAnalysis.filter((t) => t.isWeak).map((t) => t.topic);

    // Count attempts
    const previousAttempts = await Result.countDocuments({ exam: exam._id, student: req.user.id });

    // Save official Result record
    const result = await Result.create({
      student: req.user.id,
      exam: exam._id,
      answers: detailedAnswers,
      totalMarks,
      obtainedMarks: correctCount,
      percentage,
      isPassed,
      timeTaken,
      attemptNumber: previousAttempts + 1,
      status: 'evaluated',
      feedback: isPassed
        ? 'Congratulations! You have successfully passed the final comprehensive course assessment.'
        : 'Score is below 70% passing threshold. Please review weak topics and retake the assessment.',
    });

    // Update student's Enrollment assessment tracker
    await Enrollment.findOneAndUpdate(
      { student: req.user.id, course: course._id },
      {
        $set: {
          'assessment.attempted': true,
          'assessment.score': correctCount,
          'assessment.totalQuestions': totalQuestions,
          'assessment.percentage': percentage,
          'assessment.passed': isPassed,
          'assessment.attemptedAt': new Date(),
          'assessment.attemptCount': previousAttempts + 1,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: isPassed
        ? 'Assessment completed with passing marks! Eligible for certification.'
        : 'Assessment submitted. Passing score not reached.',
      summary: {
        totalQuestions,
        correctCount,
        incorrectCount,
        unansweredCount,
        obtainedMarks: correctCount,
        totalMarks,
        percentage,
        isPassed,
        passingPercentage: 70,
        attemptNumber: previousAttempts + 1,
        topicAnalysis,
        weakTopics,
      },
      reviewQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/:courseId/assessment/result
exports.getAssessmentResult = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const exam = await Exam.findOne({ course: course._id, isPublished: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    const latestResult = await Result.findOne({ exam: exam._id, student: req.user.id })
      .sort('-submittedAt');

    if (!latestResult) {
      return res.status(404).json({ success: false, message: 'No assessment attempts found for this course.' });
    }

    res.status(200).json({
      success: true,
      result: latestResult,
    });
  } catch (error) {
    next(error);
  }
};
