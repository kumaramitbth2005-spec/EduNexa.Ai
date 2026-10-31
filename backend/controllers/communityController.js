const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @GET /api/community/posts
exports.getPosts = async (req, res, next) => {
  try {
    const { type, tags, search, page = 1, limit = 15, sortBy = '-createdAt' } = req.query;
    const query = { isHidden: false };
    if (type) query.type = type;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) query.$text = { $search: search };

    const posts = await Post.find(query)
      .populate('author', 'name avatar role college')
      .populate('commentCount')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Post.countDocuments(query);
    res.status(200).json({ success: true, total, posts });
  } catch (error) {
    next(error);
  }
};

// @GET /api/community/posts/:id
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatar role college bio');

    if (!post || post.isHidden) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comments = await Comment.find({ post: post._id, isHidden: false, parentComment: null })
      .populate('author', 'name avatar role')
      .sort('createdAt');

    res.status(200).json({ success: true, post, comments });
  } catch (error) {
    next(error);
  }
};

// @POST /api/community/posts
exports.createPost = async (req, res, next) => {
  try {
    const post = await Post.create({ ...req.body, author: req.user.id });
    await post.populate('author', 'name avatar role');
    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/community/posts/:id
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, post: updated });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/community/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    res.status(200).json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/community/posts/:id/vote
exports.votePost = async (req, res, next) => {
  try {
    const { voteType } = req.body; // 'up' or 'down'
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const userId = req.user.id;
    if (voteType === 'up') {
      if (post.upvotes.includes(userId)) post.upvotes.pull(userId);
      else { post.upvotes.push(userId); post.downvotes.pull(userId); }
    } else {
      if (post.downvotes.includes(userId)) post.downvotes.pull(userId);
      else { post.downvotes.push(userId); post.upvotes.pull(userId); }
    }
    await post.save();
    res.status(200).json({ success: true, upvotes: post.upvotes.length, downvotes: post.downvotes.length });
  } catch (error) {
    next(error);
  }
};

// @POST /api/community/posts/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comment = await Comment.create({ ...req.body, post: req.params.id, author: req.user.id });
    await comment.populate('author', 'name avatar role');

    // Notify post author
    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'post_reply',
        title: 'New reply on your post',
        body: `${req.user.name} replied to your post "${post.title.slice(0, 40)}"`,
        link: `/community/posts/${post._id}`,
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// @POST /api/community/posts/:id/report
exports.reportPost = async (req, res, next) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { isReported: true, reportReason: req.body.reason });
    res.status(200).json({ success: true, message: 'Post reported. Our team will review it.' });
  } catch (error) {
    next(error);
  }
};

