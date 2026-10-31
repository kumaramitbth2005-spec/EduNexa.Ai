const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    topic: { type: String, default: '' },
    subject: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    estimatedMinutes: { type: Number, default: 30 },
    actualMinutes: { type: Number, default: 0 },
    scheduledDate: { type: Date, required: true },
    completedAt: { type: Date },
    status: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },

    // Source — what triggered this task
    source: { type: String, enum: ['manual', 'ai_planner', 'analysis_report', 'quiz_result'], default: 'manual' },
    relatedDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    relatedExam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
    relatedReport: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisReport', default: null },

    // Recurrence
    isRecurring: { type: Boolean, default: false },
    recurrenceDays: [{ type: Number, min: 0, max: 6 }], // 0=Sun,1=Mon,...
  },
  { timestamps: true }
);

studyTaskSchema.index({ user: 1, scheduledDate: 1 });

module.exports = mongoose.model('StudyTask', studyTaskSchema);

