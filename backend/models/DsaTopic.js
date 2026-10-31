const mongoose = require('mongoose');

const dsaTopicSchema = new mongoose.Schema(
  {
    moduleId: { type: Number, required: true, min: 1, max: 14 },
    moduleTitle: { type: String, required: true }, // e.g., "Module 3: Arrays and Strings"
    topicId: { type: String, required: true, unique: true, trim: true }, // e.g., "two-pointers"
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 1 },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    // 16 Structured Learning Sections
    overview: { type: String, required: true },
    importance: { type: String, required: true },
    prerequisites: [{ type: String }],
    conceptEnglish: { type: String, required: true },
    conceptHindi: { type: String, default: '' },
    syntaxAndOperations: { type: String, default: '' },
    stepByStepWorking: { type: String, default: '' },

    dryRun: {
      input: { type: String, default: '' },
      steps: [
        {
          step: { type: Number },
          state: { type: String },
          explanation: { type: String },
        },
      ],
      output: { type: String, default: '' },
    },

    complexity: {
      time: { type: String, required: true }, // e.g., "O(N)"
      space: { type: String, required: true }, // e.g., "O(1)"
      bestCase: { type: String, default: '' },
      worstCase: { type: String, default: '' },
    },

    // Multi-language code implementations (Java primary)
    codeImplementations: {
      java: { type: String, required: true },
      cpp: { type: String, default: '' },
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },

    lineByLineExplanation: [
      {
        lineOrBlock: { type: String, required: true },
        explanation: { type: String, required: true },
      },
    ],

    commonMistakes: [{ type: String }],
    interviewQuestions: [
      {
        question: { type: String, required: true },
        company: { type: String, default: 'FAANG / Top Product Companies' },
        hint: { type: String, default: '' },
      },
    ],

    practiceProblems: [
      {
        title: { type: String, required: true },
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
        platform: { type: String, default: 'LeetCode / GFG' },
        link: { type: String, default: '' },
      },
    ],

    summary: { type: String, required: true },
    nextSteps: [{ type: String }],
  },
  { timestamps: true }
);

dsaTopicSchema.index({ moduleId: 1, order: 1 });
dsaTopicSchema.index({ title: 'text', overview: 'text' });

module.exports = mongoose.model('DsaTopic', dsaTopicSchema);

