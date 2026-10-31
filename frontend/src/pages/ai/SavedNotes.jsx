import React, { useState, useEffect, useCallback } from 'react';
import {
  StickyNote, Plus, Search, Tag, Pin, Trash2, Edit3, Save, X,
  BookOpen, Brain, FileText, Loader2, AlertTriangle, ChevronDown
} from 'lucide-react';
import { notesService } from '../../services';

const SOURCE_ICONS = {
  manual: <Edit3 size={12} />,
  ai_tutor: <Brain size={12} />,
  document_analysis: <FileText size={12} />,
  summary: <BookOpen size={12} />,
};

const SOURCE_LABELS = {
  manual: 'Manual',
  ai_tutor: 'AI Tutor',
  document_analysis: 'Document Analysis',
  summary: 'Summary',
};

export default function SavedNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [saving, setSaving] = useState(false);

  // New note form state
  const [form, setForm] = useState({ title: '', content: '', subject: '', tags: '' });

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (tagFilter) params.tag = tagFilter;
      const res = await notesService.getNotes(params);
      setNotes(res.data.notes || []);
    } catch (e) {
      setError('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  }, [tagFilter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = notes.filter((n) =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await notesService.createNote({
        title: form.title,
        content: form.content,
        subject: form.subject,
        tags,
        source: 'manual',
      });
      setNotes([res.data.note, ...notes]);
      setForm({ title: '', content: '', subject: '', tags: '' });
      setShowCreateForm(false);
    } catch (e) {
      setError('Failed to create note.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    setSaving(true);
    try {
      const tags = editingNote.tags?.join(', ') === editingNote._tagsInput
        ? editingNote.tags
        : (editingNote._tagsInput || '').split(',').map((t) => t.trim()).filter(Boolean);
      const res = await notesService.updateNote(editingNote._id, {
        title: editingNote.title,
        content: editingNote.content,
        subject: editingNote.subject,
        tags,
      });
      setNotes(notes.map((n) => (n._id === editingNote._id ? res.data.note : n)));
      setEditingNote(null);
    } catch (e) {
      setError('Failed to update note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await notesService.deleteNote(id);
      setNotes(notes.filter((n) => n._id !== id));
    } catch (e) {
      setError('Failed to delete note.');
    }
  };

  const togglePin = async (note) => {
    try {
      const res = await notesService.updateNote(note._id, { isPinned: !note.isPinned });
      setNotes(notes.map((n) => (n._id === note._id ? res.data.note : n)));
    } catch (e) {}
  };

  const startEdit = (note) => {
    setEditingNote({ ...note, _tagsInput: note.tags?.join(', ') || '' });
    setShowCreateForm(false);
  };

  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <StickyNote className="text-yellow-500" size={26} />
            Saved Notes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {notes.length} note{notes.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setEditingNote(null); }}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} />
          New Note
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-700 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">New Note</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Note title *"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Subject (optional)"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Tags (comma-separated)"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Note content * (Markdown supported)"
              required
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none resize-none font-mono"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white rounded-lg font-medium transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={14} className="text-gray-400" />
            {allTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  tagFilter === tag
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-yellow-500" size={32} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <StickyNote size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="font-medium">No notes yet</p>
          <p className="text-sm mt-1">Create a note or save responses from AI Tutor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-md ${
                note.isPinned ? 'border-yellow-300 dark:border-yellow-600' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {editingNote?._id === note._id ? (
                /* Edit mode */
                <form onSubmit={handleUpdate} className="space-y-3">
                  <input
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none font-semibold"
                  />
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    rows={5}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500 outline-none resize-none font-mono"
                  />
                  <input
                    value={editingNote._tagsInput}
                    onChange={(e) => setEditingNote({ ...editingNote, _tagsInput: e.target.value })}
                    placeholder="Tags (comma-separated)"
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditingNote(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                    </button>
                  </div>
                </form>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {note.isPinned && <Pin size={12} className="text-yellow-500 flex-shrink-0" />}
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{note.title}</h3>
                      </div>
                      {note.subject && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{note.subject}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => togglePin(note)} className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${note.isPinned ? 'text-yellow-500' : 'text-gray-400'}`}>
                        <Pin size={14} />
                      </button>
                      <button onClick={() => startEdit(note)} className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(note._id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4 whitespace-pre-wrap">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1">
                      {note.tags?.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {SOURCE_ICONS[note.source]}
                      <span>{SOURCE_LABELS[note.source]}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

