const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    progress: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
    certificateUrl: String,
    lastAccessedAt: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    reviewedAt: Date,
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

