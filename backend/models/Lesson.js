const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['video', 'pdf', 'text', 'quiz', 'assignment'],
      default: 'text',
      required: true,
    },
    content: { type: String, default: '' }, // text content or markdown
    videoUrl: { type: String, default: '' },
    videoDuration: { type: Number, default: 0 }, // seconds

    // Module & Topic Hierarchy
    moduleIndex: { type: Number, default: 1 },
    moduleTitle: { type: String, default: '' },
    topicIndex: { type: Number, default: 1 },

    // Rich Academic Pedagogy Content
    introduction: { type: String, default: '' },
    definition: { type: String, default: '' },
    easyExplanation: { type: String, default: '' },
    detailedExplanation: { type: String, default: '' },
    importantConcepts: [{ type: String }],
    stepByStepWorking: [{ type: String }],
    syntax: { type: String, default: '' },
    practicalExamples: [{ type: String }],
    realWorldApplications: [{ type: String }],
    advantages: [{ type: String }],
    disadvantages: [{ type: String }],

    // Programming Topic Annotations
    codeSnippet: { type: String, default: '' },
    codeLanguage: { type: String, default: 'java' },
    codeLineByLine: [{ line: Number, code: String, explanation: String }],
    expectedOutput: { type: String, default: '' },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    practicalCodingExercise: {
      problemStatement: String,
      starterCode: String,
      solutionCode: String,
      hints: [String],
    },

    // Interview & Exam Preparation
    commonMistakes: [{ type: String }],
    interviewQuestions: [
      {
        question: String,
        answer: String,
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
      },
    ],
    revisionNotes: [{ type: String }],

    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
      },
    ],
    order: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    completionTime: { type: Number, default: 15 }, // minutes
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ course: 1, moduleIndex: 1, topicIndex: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);

