const mongoose = require('mongoose');

const topicMasterySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, index: true },
    subject: { type: String, default: 'General' },
    sessionsCount: { type: Number, default: 0 },
    questionsAttempted: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 },
    accuracyPercentage: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    masteryLevel: {
      type: String,
      enum: ['Novice', 'Developing', 'Proficient', 'Master'],
      default: 'Novice',
    },
    weakConcepts: [{ type: String }],
    strongConcepts: [{ type: String }],
    lastPracticedAt: { type: Date, default: Date.now },
    lastSearchedAt: { type: Date },
  },
  { timestamps: true }
);

topicMasterySchema.index({ user: 1, topic: 1 }, { unique: true });
topicMasterySchema.index({ user: 1, accuracyPercentage: 1 });
topicMasterySchema.index({ user: 1, lastPracticedAt: -1 });

module.exports = mongoose.model('TopicMastery', topicMasterySchema);

