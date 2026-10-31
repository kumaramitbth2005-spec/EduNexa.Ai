const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const { Assignment, Submission } = require('../models/Assignment');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @GET /api/courses/:courseId/certificate/eligibility
exports.checkCertificateEligibility = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const enrollment = await Enrollment.findOne({ student: req.user.id, course: course._id });
    if (!enrollment) {
      return res.status(200).json({
        success: true,
        isEligible: false,
        message: 'You must enroll in this course first.',
        criteria: {
          enrolled: false,
          lessonsCompleted: { required: 0, completed: 0, passed: false },
          assignmentsCompleted: { required: 22, completed: 0, passed: false },
          assignmentsPassingMarks: { passed: false, averageScore: 0 },
          assessmentCompleted: { requiredScore: 70, achievedScore: 0, passed: false },
          finalProjectCompleted: false,
        },
      });
    }

    // 1. Check Lessons Completion
    const totalLessons = await Lesson.countDocuments({ course: course._id, isPublished: true });
    const completedLessonsCount = (enrollment.completedLessons || []).length;
    const lessonsPassed = totalLessons > 0 && completedLessonsCount >= totalLessons;

    // 2. Check 22 Assignments Completion
    const totalAssignments = await Assignment.countDocuments({ course: course._id, isPublished: true });
    const submissions = await Submission.find({
      course: course._id,
      student: req.user.id,
      status: 'evaluated',
    });

    const submittedCount = submissions.length;
    const assignmentsPassed = totalAssignments > 0 && submittedCount >= totalAssignments;

    // 3. Check Assignments Average Passing Marks (>= 60%)
    const totalMarksObtained = submissions.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
    const totalPossibleMarks = submissions.reduce((sum, s) => sum + (s.totalMarks || 10), 0);
    const assignmentAverage = totalPossibleMarks > 0 ? Math.round((totalMarksObtained / totalPossibleMarks) * 100) : 0;
    const assignmentMarksPassed = assignmentAverage >= 60;

    // 4. Check Final Project (Assignment #22)
    const finalProjectAssignment = await Assignment.findOne({ course: course._id, assignmentNumber: 22 });
    let finalProjectPassed = false;
    if (finalProjectAssignment) {
      const finalProjSub = submissions.find(
        (s) => s.assignment.toString() === finalProjectAssignment._id.toString()
      );
      finalProjectPassed = !!(finalProjSub && finalProjSub.isPassed);
    } else {
      finalProjectPassed = assignmentsPassed;
    }

    // 5. Check 50-Question MCQ Assessment (>= 70%)
    const assessmentExam = await Exam.findOne({ course: course._id, isPublished: true });
    let assessmentPassed = false;
    let assessmentScore = 0;
    let assessmentPercentage = 0;

    if (assessmentExam) {
      const latestResult = await Result.findOne({ exam: assessmentExam._id, student: req.user.id, isPassed: true })
        .sort('-percentage');
      if (latestResult) {
        assessmentPassed = latestResult.percentage >= 70;
        assessmentScore = latestResult.obtainedMarks;
        assessmentPercentage = latestResult.percentage;
      }
    }

    const isEligible = lessonsPassed && assignmentsPassed && assignmentMarksPassed && assessmentPassed && finalProjectPassed;

    // Check if certificate already generated
    const existingCert = await Certificate.findOne({ student: req.user.id, course: course._id, isRevoked: false });

    res.status(200).json({
      success: true,
      isEligible,
      certificateAlreadyIssued: !!existingCert,
      certificateId: existingCert?.certificateId || null,
      course: {
        _id: course._id,
        title: course.title,
        category: course.category,
      },
      criteria: {
        enrolled: true,
        lessonsCompleted: {
          required: totalLessons,
          completed: completedLessonsCount,
          percentage: totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0,
          passed: lessonsPassed,
        },
        assignmentsCompleted: {
          required: totalAssignments,
          completed: submittedCount,
          passed: assignmentsPassed,
        },
        assignmentsPassingMarks: {
          averageScore: assignmentAverage,
          requiredAverage: 60,
          passed: assignmentMarksPassed,
        },
        finalProjectCompleted: finalProjectPassed,
        assessmentCompleted: {
          score: assessmentScore,
          percentage: assessmentPercentage,
          requiredScore: 70,
          passed: assessmentPassed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/courses/:courseId/certificate/generate
exports.generateCertificate = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const enrollment = await Enrollment.findOne({ student: req.user.id, course: course._id });
    if (!enrollment) return res.status(400).json({ success: false, message: 'Student is not enrolled in this course.' });

    // Return existing certificate if already generated
    let cert = await Certificate.findOne({ student: req.user.id, course: course._id, isRevoked: false });
    if (cert) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already generated and verified.',
        certificate: cert,
      });
    }

    // STRICT ELIGIBILITY VERIFICATION
    const totalLessons = await Lesson.countDocuments({ course: course._id, isPublished: true });
    const completedLessons = (enrollment.completedLessons || []).length;
    if (completedLessons < totalLessons) {
      return res.status(400).json({
        success: false,
        message: `Incomplete lessons: Completed ${completedLessons} of ${totalLessons} curriculum topics.`,
      });
    }

    const totalAssignments = await Assignment.countDocuments({ course: course._id, isPublished: true });
    const submissions = await Submission.find({
      course: course._id,
      student: req.user.id,
      status: 'evaluated',
    });
    if (submissions.length < totalAssignments) {
      return res.status(400).json({
        success: false,
        message: `Incomplete assignments: Submitted and evaluated ${submissions.length} of ${totalAssignments} mandatory assignments.`,
      });
    }

    const assessmentExam = await Exam.findOne({ course: course._id, isPublished: true });
    if (!assessmentExam) {
      return res.status(400).json({ success: false, message: 'Assessment not found for course.' });
    }

    const bestResult = await Result.findOne({ exam: assessmentExam._id, student: req.user.id, isPassed: true })
      .sort('-percentage');

    if (!bestResult || bestResult.percentage < 70) {
      return res.status(400).json({
        success: false,
        message: 'Must achieve at least 70% in the final 50-Question MCQ Assessment to claim certificate.',
      });
    }

    // Calculate Grade
    const overallPercentage = Math.round((bestResult.percentage * 0.5) + ((submissions.reduce((s, a) => s + (a.marksObtained || 0), 0) / (submissions.length * 10)) * 50));
    let grade = 'Certified Pass (B)';
    if (overallPercentage >= 90) grade = 'Outstanding (A+)';
    else if (overallPercentage >= 80) grade = 'Distinction (A)';
    else if (overallPercentage >= 70) grade = 'First Class (B+)';

    // Generate unique Certificate ID
    const randomCode = Math.random().toString(36).substring(2, 9).toUpperCase();
    const certificateId = `EDUNEXA-CERT-2026-${randomCode}`;
    const verificationUrl = `${req.protocol}://${req.get('host')}/verify-certificate/${certificateId}`;

    const studentName = enrollment.personalInfo?.fullName || req.user.name;
    const studentEmail = enrollment.personalInfo?.email || req.user.email;
    const college = enrollment.academicInfo?.college || req.user.college || 'National Engineering Campus';
    const branch = enrollment.academicInfo?.branch || req.user.branch || 'Computer Science & Engineering';
    const degree = enrollment.academicInfo?.degree || req.user.degree || 'Bachelor of Technology';

    // Optional Gemini citation
    let aiMessage = 'Demonstrated exemplary academic rigor, algorithm implementation, and consistent mastery of curriculum competencies.';
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
        const resAi = await model.generateContent(
          `Write an inspiring, prestigious 1-sentence academic honor citation for a student (${studentName}) graduating from "${course.title}" with a grade of ${grade}. Keep it under 25 words.`
        );
        const quote = resAi.response.text().trim().replace(/^"|"$/g, '');
        if (quote) aiMessage = quote;
      } catch (_) {}
    }

    cert = await Certificate.create({
      certificateId,
      student: req.user.id,
      studentName,
      studentEmail,
      college,
      branch,
      degree,
      course: course._id,
      courseTitle: course.title,
      courseCategory: course.category,
      completionDate: new Date(),
      grade,
      overallPercentage,
      lessonsCompleted: totalLessons,
      assignmentsCompleted: totalAssignments,
      assessmentScore: bestResult.obtainedMarks,
      aiAchievementMessage: aiMessage,
      verificationUrl,
    });

    // Update Enrollment
    enrollment.certificateIssued = true;
    enrollment.certificateId = cert.certificateId;
    enrollment.certificateIssuedAt = new Date();
    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Certificate successfully verified and issued!',
      certificate: cert,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/certificates/verify/:certificateId (PUBLIC)
exports.verifyCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId.trim().toUpperCase() });

    if (!cert || cert.isRevoked) {
      return res.status(404).json({
        success: false,
        isVerified: false,
        message: 'Invalid, unverified, or revoked Certificate ID.',
      });
    }

    // Public sanitized verification payload (protects private student contact information)
    res.status(200).json({
      success: true,
      isVerified: true,
      certificate: {
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        college: cert.college,
        branch: cert.branch,
        degree: cert.degree,
        courseTitle: cert.courseTitle,
        courseCategory: cert.courseCategory,
        grade: cert.grade,
        overallPercentage: cert.overallPercentage,
        completionDate: cert.completionDate,
        issuedBy: cert.signatureAuthority?.name || 'Dr. Rajesh Sharma, Ph.D.',
        authorityTitle: cert.signatureAuthority?.title || 'Chairperson, EduNexa Academic Board',
        aiAchievementMessage: cert.aiAchievementMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/certificates/:certificateId
exports.getCertificateDetails = async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId.trim().toUpperCase() });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });

    res.status(200).json({
      success: true,
      certificate: cert,
    });
  } catch (error) {
    next(error);
  }
};
