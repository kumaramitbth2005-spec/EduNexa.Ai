const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['tutor', 'summarizer', 'question-gen', 'study-planner', 'translation'],
      default: 'tutor',
    },
    title: { type: String, default: 'New Conversation' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        metadata: {
          tokens: Number,
          model: String,
        },
      },
    ],
    context: { type: String }, // uploaded PDF text or extra context
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    isActive: { type: Boolean, default: true },
    totalTokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

aiConversationSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);

