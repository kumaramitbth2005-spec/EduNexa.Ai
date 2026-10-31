const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['pdf', 'video', 'document', 'presentation', 'image', 'question-paper', 'lab-manual', 'practical', 'other'],
      required: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    fileSize: { type: Number }, // bytes
    mimeType: { type: String },
    semester: { type: Number, min: 1, max: 8 },
    tags: [{ type: String }],
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true }, // admin can toggle
    year: { type: Number }, // for previous year papers
    examType: { type: String }, // mid-term, end-term, etc.
  },
  { timestamps: true }
);

studyMaterialSchema.index({ course: 1, type: 1 });
studyMaterialSchema.index({ title: 'text', description: 'text', tags: 'text' });
studyMaterialSchema.index({ semester: 1, type: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);

