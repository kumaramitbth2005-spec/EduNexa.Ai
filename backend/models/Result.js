const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: mongoose.Schema.Types.ObjectId, // for MCQ
  textAnswer: String, // for short/long
  codeAnswer: String, // for coding
  isCorrect: Boolean,
  marksObtained: { type: Number, default: 0 },
});

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [answerSchema],
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    isPassed: { type: Boolean, required: true },
    timeTaken: { type: Number }, // seconds
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'evaluated', 'reviewed'], default: 'submitted' },
    attemptNumber: { type: Number, default: 1 },
    feedback: String,
    startedAt: Date,
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, exam: 1 });
resultSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model('Result', resultSchema);

