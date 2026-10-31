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
      required: true,
    },
    content: { type: String, default: '' }, // text content or video URL
    videoUrl: { type: String, default: '' },
    videoDuration: { type: Number, default: 0 }, // seconds
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
    completionTime: { type: Number, default: 10 }, // minutes
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);

