const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getPosts, getPost, createPost, updatePost, deletePost, votePost, addComment, reportPost } = require('../controllers/communityController');

router.get('/posts', protect, getPosts);
router.get('/posts/:id', protect, getPost);
router.post('/posts', protect, createPost);
router.put('/posts/:id', protect, updatePost);
router.delete('/posts/:id', protect, deletePost);
router.post('/posts/:id/vote', protect, votePost);
router.post('/posts/:id/comments', protect, addComment);
router.post('/posts/:id/report', protect, reportPost);

module.exports = router;

