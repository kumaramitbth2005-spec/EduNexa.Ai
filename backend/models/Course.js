const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: { type: String, required: true, maxlength: 2000 },
    shortDescription: { type: String, maxlength: 300 },
    thumbnail: { type: String, default: '' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['programming', 'web-dev', 'data-science', 'ai-ml', 'cybersecurity', 'mobile-dev', 'database', 'cloud', 'dsa', 'other'],
      required: true,
    },
    tags: [{ type: String }],
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    language: { type: String, enum: ['en', 'hi', 'en-hi'], default: 'en' },
    semester: { type: Number, min: 1, max: 8 },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    enrollmentCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    duration: { type: String, default: '' }, // e.g. "12 hours"
    prerequisites: [{ type: String }],
    outcomes: [{ type: String }],
    requirements: [{ type: String }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

courseSchema.virtual('lessonCount', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
  count: true,
});

courseSchema.index({ teacher: 1 });
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);

