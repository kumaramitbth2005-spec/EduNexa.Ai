const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['dsa', 'subject_note'], required: true },
    topicId: { type: String, required: true }, // dsa topicId or subjectNote _id
    completed: { type: Boolean, default: false },
    bookmarked: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastStudiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

topicProgressSchema.index({ user: 1, type: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model('TopicProgress', topicProgressSchema);
