import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectNotesService, practiceService } from '../../services';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import {
  BookOpen, Search, Filter, Layers, Bookmark, CheckCircle2,
  ChevronRight, Sparkles, HelpCircle, FileText, Check, Award,
  Volume2, Eye, ArrowLeft, ExternalLink, Globe, Star, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubjectNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});

  // Filter state
  const [search, setSearch] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState(5);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [languageMode, setLanguageMode] = useState('en'); // 'en' or 'hi'

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = { degree, branch, semester };
      if (selectedSubject) params.subject = selectedSubject;
      if (search) params.search = search;

      const res = await subjectNotesService.getNotes(params);
      setNotes(res.data.notes || []);
      setUserProgress(res.data.userProgress || {});
    } catch {
      toast.error('Failed to load subject notes');
    } finally {
      setLoading(false);
    }
  }, [degree, branch, semester, selectedSubject, search]);

  const fetchHierarchy = async () => {
    try {
      const res = await subjectNotesService.getHierarchy();
      setHierarchy(res.data.hierarchy || []);
    } catch {}
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openNoteDetail = async (noteId) => {
    try {
      const res = await subjectNotesService.getNoteById(noteId);
      setSelectedNote(res.data.note);
      if (res.data.note?.topic) {
        practiceService.trackTopicActivity({
          topic: res.data.note.topic,
          subject: res.data.note.subject || 'Computer Science',
          action: 'studied',
        }).catch(() => {});
      }
      if (res.data.progress) {
        setUserProgress((prev) => ({
          ...prev,
          [noteId]: res.data.progress,
        }));
      }
    } catch {
      toast.error('Failed to load note details');
    }
  };

  const toggleBookmark = async (noteId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const newStatus = !currentStatus;
      await subjectNotesService.updateProgress(noteId, { bookmarked: newStatus });
      setUserProgress((prev) => ({
        ...prev,
        [noteId]: { ...(prev[noteId] || {}), bookmarked: newStatus },
      }));
      toast.success(newStatus ? 'Note bookmarked!' : 'Bookmark removed');
    } catch {
      toast.error('Could not update bookmark');
    }
  };

  const toggleCompleted = async (noteId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await subjectNotesService.updateProgress(noteId, { completed: newStatus });
      setUserProgress((prev) => ({
        ...prev,
        [noteId]: { ...(prev[noteId] || {}), completed: newStatus },
      }));
      toast.success(newStatus ? 'Topic marked as completed! 🎉' : 'Marked as uncompleted');
    } catch {
      toast.error('Could not update progress');
    }
  };

  // Distinct subjects in current semester
  const availableSubjects = [
    ...new Set(
      hierarchy
        .filter((h) => Number(h.semester) === Number(semester))
        .map((h) => h.subject)
    ),
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-500" />
          Subject & Topic Learning Vault
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete, verified curriculum notes structured by Education Level, Degree, Branch, and Semester
        </p>
      </div>

      {/* Hierarchical Filter Bar */}
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Degree</label>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="input text-xs"
            >
              <option value="B.Tech">B.Tech / B.E.</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="B.Sc">B.Sc Computer Science</option>
            </select>
          </div>

          <div>
            <label className="label">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="input text-xs"
            >
              <option value="Computer Science & Engineering">CSE / IT</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Mechanical Engineering">Mechanical</option>
            </select>
          </div>

          <div>
            <label className="label">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="input text-xs"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input text-xs"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any concept, formula, algorithm, or topic name..."
            className="input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Topic Notes Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard type="course" count={4} />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((n) => {
            const isCompleted = userProgress[n._id]?.completed;
            const isBookmarked = userProgress[n._id]?.bookmarked;

            return (
              <div
                key={n._id}
                onClick={() => openNoteDetail(n._id)}
                className={`card p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
                  isCompleted ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/10' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                        {n.subject} • Sem {n.semester}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{n.unit}</p>
                    </div>
                    <button
                      onClick={(e) => toggleBookmark(n._id, isBookmarked, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBookmarked ? 'text-amber-500 bg-amber-50 dark:bg-amber-950' : 'text-gray-400 hover:text-amber-500'
                      }`}
                      title="Bookmark topic"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                    {n.topic}
                  </h3>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {n.introduction}
                  </p>

                  {/* Key Concepts Badges */}
                  {n.keyConcepts && n.keyConcepts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {n.keyConcepts.slice(0, 3).map((kc, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {kc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="text-gray-400">Ready to read</span>
                    )}
                  </div>
                  <span className="text-primary-600 font-semibold flex items-center gap-1">
                    Study Topic <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No notes found for this filter"
          description="Try switching subjects or resetting search terms to discover comprehensive study notes."
        />
      )}

      {/* Reader Modal (17 Comprehensive Sections) */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-4xl p-6 md:p-8 relative max-h-[92vh] overflow-y-auto space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                    {selectedNote.subject} ({selectedNote.subjectCode || 'University Core'})
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {selectedNote.topic}
                  </h2>
                </div>
              </div>

              {/* Language, Practice & Completion Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/practice?topic=${encodeURIComponent(selectedNote.topic)}`)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  title="Practice this topic with AI questions, MCQs, and rubric evaluation"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>AI Practice</span>
                </button>
                <button
                  onClick={() => setLanguageMode(languageMode === 'en' ? 'hi' : 'en')}
                  className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 font-semibold"
                  title="Toggle Hindi/English Explanation"
                >
                  <Globe className="w-3.5 h-3.5 text-primary-500" />
                  {languageMode === 'en' ? 'हिंदी व्याख्या' : 'English View'}
                </button>
                <button
                  onClick={() => toggleCompleted(selectedNote._id, userProgress[selectedNote._id]?.completed)}
                  className={`btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 ${
                    userProgress[selectedNote._id]?.completed ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {userProgress[selectedNote._id]?.completed ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>

            {/* Section 1: Overview & Simple Explanation */}
            <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/50 dark:border-primary-900/50 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                💡 Simple Explanation for Beginners
              </h4>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {selectedNote.simpleExplanation}
              </p>
              {languageMode === 'hi' && selectedNote.hindiExplanation && (
                <div className="pt-2 border-t border-primary-200/40 text-sm text-gray-700 dark:text-gray-300 italic">
                  <strong>हिंदी व्याख्या: </strong>{selectedNote.hindiExplanation}
                </div>
              )}
            </div>

            {/* Section 2: Definitions */}
            {selectedNote.definitions && selectedNote.definitions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Key Definitions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedNote.definitions.map((def, idx) => (
                    <div key={idx} className="card p-3.5 border-l-4 border-l-primary-500 space-y-1">
                      <span className="font-bold text-xs text-primary-600 dark:text-primary-400">{def.term}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Detailed Explanation & Working Principles */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Working Principles & Mechanics</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedNote.detailedExplanation || selectedNote.workingPrinciples}
              </p>
            </div>

            {/* Section 4: Step-by-Step Examples & Dry Runs */}
            {selectedNote.stepStepExamples && selectedNote.stepByStepExamples.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Step-by-Step Worked Example</h3>
                {selectedNote.stepByStepExamples.map((ex, i) => (
                  <div key={i} className="card p-4 space-y-3 bg-gray-50 dark:bg-gray-800/60">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{ex.title}</h4>
                    {ex.description && <p className="text-xs text-gray-500">{ex.description}</p>}
                    <ol className="space-y-1.5 list-decimal list-inside text-xs text-gray-700 dark:text-gray-300">
                      {ex.steps.map((st, si) => (
                        <li key={si} className="leading-relaxed">{st}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            {/* Section 5: Visual Diagram */}
            {selectedNote.visualDiagram && (
              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">System Diagram & Flow</h3>
                <pre className="p-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                  {selectedNote.visualDiagram}
                </pre>
              </div>
            )}

            {/* Section 6: Real Life Applications & Pros/Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedNote.realLifeApplications && selectedNote.realLifeApplications.length > 0 && (
                <div className="card p-4 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Real-World Industry Applications</h4>
                  <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                    {selectedNote.realLifeApplications.map((app, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary-500 font-bold">•</span>
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedNote.advantagesAndDisadvantages && (
                <div className="card p-4 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Trade-offs & Constraints</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-600">Advantages:</span>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 pl-1 mt-0.5">
                        {selectedNote.advantagesAndDisadvantages.advantages?.map((adv, i) => (
                          <li key={i}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-rose-600">Disadvantages:</span>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 pl-1 mt-0.5">
                        {selectedNote.advantagesAndDisadvantages.disadvantages?.map((dis, i) => (
                          <li key={i}>{dis}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 7: Exam Questions & Quick Revision Notes */}
            {selectedNote.quickRevisionNotes && (
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Quick Revision High-Yield Notes
                </h4>
                <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300 list-disc list-inside">
                  {selectedNote.quickRevisionNotes.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

