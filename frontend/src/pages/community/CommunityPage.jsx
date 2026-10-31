import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { communityService } from '../../services';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import {
  MessageSquare, ThumbsUp, MessageCircle, Eye, Plus,
  Search, Filter, Tag, CheckCircle2, User
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [type]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (type) params.type = type;
      if (search) params.search = search;

      const res = await communityService.getPosts(params);
      setPosts(res.data.posts || []);
    } catch (err) {
      toast.error('Failed to load community discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (e, postId, voteType) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await communityService.votePost(postId, voteType);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, upvotes: { length: res.data.upvotes } } : p))
      );
    } catch {
      toast.error('Failed to submit vote');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary-500" />
            Student Community & Discussions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Exchange study materials, ask technical doubts, and collaborate with peer engineers
          </p>
        </div>

        <Link
          to="/community/new"
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-md shadow-primary-500/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ask Question / New Post
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
              placeholder="Search questions by keyword or topic..."
              className="input pl-9 text-sm"
            />
          </div>

          <div className="flex gap-2">
            {['', 'question', 'discussion', 'resource'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  type === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {t === '' ? 'All Posts' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard type="post" count={4} />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post._id}
              to={`/community/posts/${post._id}`}
              className="card p-5 block transition-all hover:border-primary-300 dark:hover:border-primary-800 group"
            >
              <div className="flex items-start gap-4">
                {/* Upvote Pill */}
                <button
                  onClick={(e) => handleVote(e, post._id, 'up')}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-primary-50 dark:hover:bg-primary-950 text-gray-600 dark:text-gray-400 hover:text-primary-600 border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-1 min-w-[48px]"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-bold">{post.upvotes?.length || 0}</span>
                </button>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                      {post.type}
                    </span>
                    {post.tags?.map((t, idx) => (
                      <span key={idx} className="text-[11px] text-gray-400 font-medium flex items-center gap-0.5">
                        #{t}
                      </span>
                    ))}
                    {post.isResolved && (
                      <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary-200 dark:bg-primary-900 text-primary-700 flex items-center justify-center font-bold text-[10px]">
                        {post.author?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {post.author?.name || 'Student'}
                      </span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {post.commentCount || 0} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.views || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No discussions started yet"
          description="Be the first to ask a question or initiate a technical topic discussion."
          actionLabel="Create New Post"
          onAction={() => (window.location.href = '/community/new')}
        />
      )}
    </div>
  );
}

