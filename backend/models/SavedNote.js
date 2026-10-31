const mongoose = require('mongoose');

const savedNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    contentType: { type: String, enum: ['markdown', 'plain'], default: 'markdown' },
    tags: [{ type: String, trim: true }],
    subject: { type: String, default: '' },
    isPinned: { type: Boolean, default: false },
    isBookmarked: { type: Boolean, default: false },

    // Source traceability
    source: { type: String, enum: ['manual', 'ai_tutor', 'document_analysis', 'summary'], default: 'manual' },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIConversation', default: null },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },

    exportedAt: { type: Date },
  },
  { timestamps: true }
);

savedNoteSchema.index({ user: 1, createdAt: -1 });
savedNoteSchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('SavedNote', savedNoteSchema);

