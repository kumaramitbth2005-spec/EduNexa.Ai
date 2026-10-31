const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Uploaded Document' },
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary public_id
    mimeType: {
      type: String,
      enum: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      required: true,
    },
    fileSize: { type: Number, default: 0 }, // bytes
    pageCount: { type: Number, default: 1 },

    // OCR Results
    ocrText: { type: String, default: '' },
    ocrConfidence: { type: String, enum: ['high', 'medium', 'low', 'failed', 'not_applicable'], default: 'not_applicable' },
    ocrNotes: { type: String, default: '' }, // e.g., "Some sections unreadable"
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
    processingError: { type: String, default: '' },

    // AI-detected metadata
    detectedSubject: { type: String, default: '' },
    detectedTopics: [{ type: String }],
    detectedLanguage: { type: String, default: 'en' },

    // Subject link (optional — student can tag a subject)
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    subjectName: { type: String, default: '' }, // denormalized for display
  },
  { timestamps: true }
);

documentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);

