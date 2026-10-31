const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq_single', 'mcq_multi', 'conceptual', 'short_answer', 'long_answer', 'coding', 'scenario'],
    required: true,
  },
  question: { type: String, required: true },
  context: { type: String, default: '' },
  options: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  correctAnswer: { type: mongoose.Schema.Types.Mixed },
  modelAnswer: { type: String, default: '' },
  rubric: [
    {
      criterion: { type: String, required: true },
      marks: { type: Number, required: true, default: 1 },
      description: { type: String, default: '' },
    },
  ],
  codingDetails: {
    starterCode: {
      java: { type: String, default: '' },
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
      cpp: { type: String, default: '' },
    },
    problemStatement: { type: String, default: '' },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    constraints: { type: String, default: '' },
    testCases: [
      {
        input: { type: String, default: '' },
        expectedOutput: { type: String, default: '' },
        isHidden: { type: Boolean, default: false },
      },
    ],
  },
  explanation: { type: String, default: '' },
  hints: [{ type: String }],
  marks: { type: Number, default: 1 },
  userAnswer: { type: mongoose.Schema.Types.Mixed },
  evaluation: {
    marksObtained: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
    feedback: { type: String, default: '' },
    rubricScores: [
      {
        criterion: { type: String },
        awarded: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        comment: { type: String, default: '' },
      },
    ],
    testCaseResults: [
      {
        input: { type: String },
        expected: { type: String },
        actual: { type: String },
        passed: { type: Boolean, default: false },
      },
    ],
    improvementTips: [{ type: String }],
  },
});

const practiceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, index: true },
    subject: { type: String, default: 'Computer Science' },
    category: {
      type: String,
      enum: ['all', 'mcq', 'conceptual', 'written', 'coding', 'scenario'],
      default: 'all',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    mode: {
      type: String,
      enum: ['practice', 'learning', 'assessment'],
      default: 'practice',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    timeSpentSeconds: { type: Number, default: 0 },
    questions: [questionSchema],
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    feedbackSummary: { type: String, default: '' },
    weakConcepts: [{ type: String }],
    strongConcepts: [{ type: String }],
    completedAt: { type: Date },
  },
  { timestamps: true }
);

practiceSessionSchema.index({ user: 1, createdAt: -1 });
practiceSessionSchema.index({ user: 1, topic: 1 });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);

