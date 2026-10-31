const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    assignmentNumber: { type: Number, required: true }, // 1 to 22
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    moduleIndex: { type: Number, default: 1 },
    moduleTitle: { type: String, default: '' },
    topicTitle: { type: String, default: '' },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'final_project'],
      default: 'beginner',
    },
    type: {
      type: String,
      enum: ['mcq', 'short-answer', 'descriptive', 'programming', 'mini-project', 'final-project'],
      default: 'programming',
    },
    objective: { type: String, required: true },
    problemStatement: { type: String, required: true },
    instructions: [{ type: String }],
    requirements: [{ type: String }],
    expectedOutput: { type: String, default: '' },
    evaluationCriteria: [{ type: String }],
    starterCode: {
      java: String,
      python: String,
      javascript: String,
      cpp: String,
    },
    solutionTemplate: String,
    totalMarks: { type: Number, required: true, default: 10 },
    passingMarks: { type: Number, default: 6 },
    dueDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ course: 1, assignmentNumber: 1 }, { unique: true });

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    content: { type: String, default: '' }, // written text or descriptive response
    code: { type: String, default: '' }, // submitted code
    language: { type: String, default: 'java' },
    fileUrl: String,
    linkUrl: String,
    status: {
      type: String,
      enum: ['draft', 'submitted', 'evaluated'],
      default: 'submitted',
    },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    marksObtained: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 10 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    feedback: { type: String, default: '' },
    missingConcepts: [{ type: String }],
    improvements: [{ type: String }],
    evaluator: { type: String, enum: ['ai', 'teacher', 'auto'], default: 'ai' },
    evaluatedAt: Date,
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ course: 1, student: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Assignment, Submission };

