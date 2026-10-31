const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    progress: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,

    // Detailed Registration Information from Dedicated Form
    personalInfo: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true },
      mobile: { type: String, trim: true },
      profilePicture: { type: String, default: '' },
    },
    academicInfo: {
      college: { type: String, trim: true },
      degree: { type: String, trim: true },
      branch: { type: String, trim: true },
      currentYear: { type: String, trim: true },
      currentSemester: { type: String, trim: true },
      studentId: { type: String, trim: true },
    },
    courseInfo: {
      selectedCourse: { type: String, trim: true },
      courseCategory: { type: String, trim: true },
      learningLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
      learningGoal: { type: String, trim: true },
      preferredLanguage: { type: String, default: 'en' },
    },
    declarationConfirmed: { type: Boolean, default: true },

    // Progressive 22 Assignments Tracker
    assignmentsProgress: {
      submittedCount: { type: Number, default: 0 },
      evaluatedCount: { type: Number, default: 0 },
      totalMarksObtained: { type: Number, default: 0 },
      totalPossibleMarks: { type: Number, default: 220 },
    },

    // Mandatory 50-Question Assessment Tracker
    assessment: {
      attempted: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 50 },
      percentage: { type: Number, default: 0 },
      passed: { type: Boolean, default: false },
      attemptedAt: Date,
      attemptCount: { type: Number, default: 0 },
    },

    // Verified Certification Tracker
    certificateIssued: { type: Boolean, default: false },
    certificateId: { type: String, trim: true },
    certificateUrl: String,
    certificateIssuedAt: Date,

    lastAccessedAt: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    reviewedAt: Date,
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

