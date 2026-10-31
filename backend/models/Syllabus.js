const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  unit: { type: String, default: '' }, // Unit/Chapter number
  subtopics: [{ type: String }],
  estimatedHours: { type: Number, default: 1 },
  weightage: { type: Number, default: 0 }, // exam weightage %
}, { _id: true });

const syllabusSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, default: '' },
    degree: { type: String, required: true, trim: true }, // e.g., "B.Tech", "BCA"
    branch: { type: String, required: true, trim: true }, // e.g., "CSE", "ECE"
    semester: { type: Number, required: true, min: 1, max: 8 },
    university: { type: String, default: 'General' },
    version: { type: String, default: '1.0' },
    topics: [topicSchema],
    totalTopics: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

syllabusSchema.pre('save', function (next) {
  this.totalTopics = this.topics.length;
  next();
});

syllabusSchema.index({ degree: 1, branch: 1, semester: 1, subject: 1 });

module.exports = mongoose.model('Syllabus', syllabusSchema);

