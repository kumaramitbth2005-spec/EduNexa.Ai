const mongoose = require('mongoose');

const subjectNoteSchema = new mongoose.Schema(
  {
    educationLevel: {
      type: String,
      enum: ['undergraduate', 'postgraduate', 'school', 'other'],
      default: 'undergraduate',
    },
    degree: { type: String, required: true, trim: true, default: 'B.Tech' },
    branch: { type: String, required: true, trim: true, default: 'Computer Science & Engineering' },
    semester: { type: Number, required: true, min: 1, max: 8, default: 3 },
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true, default: '' },
    unit: { type: String, required: true, trim: true }, // e.g. "Unit 1: Process Management"
    topic: { type: String, required: true, trim: true },
    order: { type: Number, default: 1 },

    // Core Educational Content
    introduction: { type: String, required: true },
    simpleExplanation: { type: String, required: true },
    detailedExplanation: { type: String, default: '' },
    hindiExplanation: { type: String, default: '' },

    definitions: [
      {
        term: { type: String, required: true },
        definition: { type: String, required: true },
      },
    ],
    keyConcepts: [{ type: String }],
    workingPrinciples: { type: String, default: '' },

    stepByStepExamples: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        steps: [{ type: String }],
      },
    ],

    realLifeApplications: [{ type: String }],
    advantagesAndDisadvantages: {
      advantages: [{ type: String }],
      disadvantages: [{ type: String }],
    },

    visualDiagram: { type: String, default: '' }, // Markdown diagram or ASCII representation
    formulas: [
      {
        name: { type: String },
        formula: { type: String },
        explanation: { type: String },
      },
    ],

    examQuestions: {
      shortAnswer: [{ type: String }],
      longAnswer: [{ type: String }],
      mcqs: [
        {
          question: { type: String },
          options: [{ type: String }],
          answer: { type: String },
          explanation: { type: String },
        },
      ],
    },

    quickRevisionNotes: [{ type: String }],
    learningResources: [
      {
        title: { type: String },
        url: { type: String },
        type: { type: String, enum: ['video', 'article', 'book', 'paper'], default: 'article' },
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: true },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

subjectNoteSchema.index({ degree: 1, branch: 1, semester: 1, subject: 1 });
subjectNoteSchema.index({ subject: 1, unit: 1, order: 1 });
subjectNoteSchema.index({ topic: 'text', introduction: 'text', keyConcepts: 'text' });

module.exports = mongoose.model('SubjectNote', subjectNoteSchema);

