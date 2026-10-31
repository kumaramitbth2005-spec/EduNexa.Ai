import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { communityService } from '../../services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare, ArrowLeft, Send, Tag, Code, Eye, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreatePost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type: 'question',
    content: '',
    tags: '',
    codeSnippet: '',
    language: 'javascript',
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in the title and content');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : [],
      };
      const res = await communityService.createPost(payload);
      toast.success('Post published to community!');
      navigate(`/community/posts/${res.data.post._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create discussion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      <Link to="/community" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      <div>
        <h1 className="page-title flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          Create New Discussion or Question
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Share insights, request help with difficult algorithms, or upload reference resources
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Title / Main Question</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. How does garbage collection work in V8 engine vs Java JVM?"
            className="input text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input text-sm"
            >
              <option value="question">Technical Question / Doubt</option>
              <option value="discussion">General Academic Discussion</option>
              <option value="resource">Study Resource / Notes Share</option>
              <option value="announcement">College / Club Announcement</option>
            </select>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="algorithms, java, operating-systems, gate"
              className="input text-sm"
            />
          </div>
        </div>

        {/* Content with Markdown Preview Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">Detailed Description (Markdown Supported)</label>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  !previewMode ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-400'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  previewMode ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>
          </div>

          {!previewMode ? (
            <textarea
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe your question, provide context, what you have tried so far..."
              className="input text-sm font-sans"
              required
            />
          ) : (
            <div className="min-h-[200px] p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850 prose dark:prose-invert max-w-none text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formData.content || '*No content entered yet.*'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Optional Code Snippet */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="label !mb-0 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-primary-500" />
              Optional Code Snippet
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="text-xs border rounded p-1 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="sql">SQL</option>
            </select>
          </div>
          <textarea
            rows={5}
            value={formData.codeSnippet}
            onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
            placeholder="Paste code or error stack trace here..."
            className="input font-mono text-xs"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Link to="/community" className="btn-secondary text-sm px-4 py-2">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm px-6 py-2 flex items-center gap-2 shadow-md shadow-primary-500/25"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

