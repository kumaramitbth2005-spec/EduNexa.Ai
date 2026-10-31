import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { communityService } from '../../services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare, ThumbsUp, ThumbsDown, ArrowLeft, Send,
  User, CheckCircle2, AlertTriangle, MessageCircle, Code
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await communityService.getPost(id);
      setPost(res.data.post);
      setComments(res.data.comments || []);
    } catch (err) {
      toast.error('Failed to load discussion details');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      const res = await communityService.votePost(id, voteType);
      setPost((prev) => ({
        ...prev,
        upvotes: { length: res.data.upvotes },
        downvotes: { length: res.data.downvotes },
      }));
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await communityService.addComment(id, { content: newComment });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
      toast.success('Reply posted!');
    } catch (err) {
      toast.error('Failed to post reply');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Please specify why you are reporting this content:');
    if (!reason) return;
    try {
      await communityService.reportPost(id, reason);
      toast.success('Report submitted for moderation');
    } catch {
      toast.error('Report failed');
    }
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading conversation thread...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="card p-12 text-center">
        <h3 className="text-lg font-bold">Discussion not found</h3>
        <Link to="/community" className="btn-primary text-xs mt-4 inline-block">Back to Community</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      {/* Back button */}
      <Link to="/community" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      {/* Main Post Card */}
      <div className="card p-6 md:p-8 space-y-6 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {post.author?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">{post.author?.name}</h4>
              <p className="text-xs text-gray-400">
                {post.author?.college || 'Student'} • {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950 text-primary-600">
              {post.type}
            </span>
            <button onClick={handleReport} className="p-1 text-gray-400 hover:text-rose-500" title="Report post">
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {post.title}
        </h1>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t, idx) => (
              <span key={idx} className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md font-medium">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Content Markdown */}
        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Optional Code Snippet */}
        {post.codeSnippet && (
          <div className="rounded-xl overflow-hidden bg-gray-950 text-gray-100 p-4 font-mono text-xs">
            <div className="text-[11px] text-gray-400 pb-2 mb-2 border-b border-gray-800 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-primary-400" />
              <span>{post.language || 'Code Snippet'}</span>
            </div>
            <pre className="overflow-x-auto">{post.codeSnippet}</pre>
          </div>
        )}

        {/* Post Actions Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleVote('up')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ThumbsUp className="w-4 h-4 text-primary-600" />
              <span className="font-bold">{post.upvotes?.length || 0}</span>
            </button>
            <button
              onClick={() => handleVote('down')}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ThumbsDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length} replies</span>
          </div>
        </div>
      </div>

      {/* Comments Thread */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-gray-900 dark:text-white">
          Replies & Answers ({comments.length})
        </h3>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="card p-4 space-y-3">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a constructive response or solution..."
            className="input text-sm"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingComment ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>

        {/* Existing Comments */}
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment._id} className="card p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 flex items-center justify-center font-bold text-[10px]">
                    {comment.author?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{comment.author?.name}</span>
                  <span className="text-gray-400">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

