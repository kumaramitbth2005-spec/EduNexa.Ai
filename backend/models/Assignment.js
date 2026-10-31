const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, default: 10 },
    attachments: [{ name: String, url: String }],
    allowLateSubmission: { type: Boolean, default: false },
    latePenalty: { type: Number, default: 0 }, // % per day
    instructions: [String],
    submissionType: { type: String, enum: ['file', 'text', 'link', 'any'], default: 'any' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    fileUrl: String,
    linkUrl: String,
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
    grade: Number,
    feedback: String,
    gradedAt: Date,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Assignment, Submission };

