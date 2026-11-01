const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      default: 'Indian Institute of Technology / NIT Partner Campus',
      trim: true,
    },
    branch: {
      type: String,
      default: 'Computer Science & Engineering',
      trim: true,
    },
    degree: {
      type: String,
      default: 'Bachelor of Technology',
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    courseCategory: {
      type: String,
      required: true,
      trim: true,
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: String,
      enum: ['Outstanding (A+)', 'Distinction (A)', 'First Class (B+)', 'Certified Pass (B)'],
      default: 'Distinction (A)',
    },
    overallPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    lessonsCompleted: {
      type: Number,
      required: true,
    },
    assignmentsCompleted: {
      type: Number,
      default: 22,
    },
    assessmentScore: {
      type: Number, // out of 50
      required: true,
    },
    aiAchievementMessage: {
      type: String,
      default: 'Demonstrated exemplary mastery over academic fundamentals, algorithms, system design, and comprehensive assessments.',
    },
    signatureAuthority: {
      name: { type: String, default: 'Dr. Rajesh Sharma, Ph.D.' },
      title: { type: String, default: 'Chairperson, EduNexa Academic Standards Board' },
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

certificateSchema.index({ student: 1, course: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);

