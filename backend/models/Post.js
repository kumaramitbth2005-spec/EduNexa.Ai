const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    type: {
      type: String,
      enum: ['question', 'discussion', 'resource', 'announcement'],
      default: 'discussion',
    },
    tags: [{ type: String }],
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    images: [{ type: String }],
    codeSnippet: { type: String },
    language: { type: String },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    isResolved: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String },
    isHidden: { type: Boolean, default: false },
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true,
});

postSchema.index({ author: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);

