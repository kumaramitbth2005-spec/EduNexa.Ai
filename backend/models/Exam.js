const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'short', 'long', 'coding', 'true-false'], required: true },
  options: [{ text: String, isCorrect: Boolean }], // for MCQ
  correctAnswer: String, // for short/long
  explanation: { type: String },
  marks: { type: Number, default: 1 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  topic: String,
  imageUrl: String,
  codeTemplate: String, // for coding questions
});

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['mcq', 'mixed', 'coding', 'practice', 'mock'],
      default: 'mcq',
    },
    questions: [questionSchema],
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    duration: { type: Number, required: true }, // minutes
    instructions: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    startTime: Date,
    endTime: Date,
    allowReview: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showResultImmediately: { type: Boolean, default: true },
    attemptLimit: { type: Number, default: 1 },
    tags: [{ type: String }],
    semester: Number,
    category: String,
  },
  { timestamps: true }
);

examSchema.index({ createdBy: 1 });
examSchema.index({ course: 1, isPublished: 1 });

// Never return correct answers to students
examSchema.methods.getSafeQuestions = function () {
  return this.questions.map((q) => ({
    _id: q._id,
    text: q.text,
    type: q.type,
    options: q.options ? q.options.map((o) => ({ _id: o._id, text: o.text })) : [],
    marks: q.marks,
    difficulty: q.difficulty,
    topic: q.topic,
    imageUrl: q.imageUrl,
    codeTemplate: q.codeTemplate,
  }));
};

module.exports = mongoose.model('Exam', examSchema);

