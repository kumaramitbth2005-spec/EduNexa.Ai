const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['course', 'lesson', 'material', 'post', 'exam'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'type' },
    note: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, type: 1 });
bookmarkSchema.index({ user: 1, itemId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);

