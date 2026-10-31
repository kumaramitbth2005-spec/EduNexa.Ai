import React, { useState, useEffect } from 'react';
import { dsaService } from '../../services';
import SkeletonCard from '../../components/common/SkeletonCard';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  Code, Terminal, CheckCircle2, Clock, Award, ChevronRight,
  BookOpen, Sparkles, AlertCircle, Copy, Check, ArrowRight,
  HelpCircle, Eye, ExternalLink, Globe, Layers, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DsaLearning() {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(2);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeLang, setActiveLang] = useState('java'); // java, cpp, python, javascript
  const [loading, setLoading] = useState(true);
  const [topicLoading, setTopicLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [revealedHints, setRevealedHints] = useState({});
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    loadTopics(selectedModuleId);
  }, [selectedModuleId]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const res = await dsaService.getModules();
      setModules(res.data.modules || []);
    } catch {
      toast.error('Failed to load DSA modules');
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (modId) => {
    try {
      setTopicLoading(true);
      const res = await dsaService.getTopics({ moduleId: modId });
      setTopics(res.data.topics || []);
      setUserProgress(res.data.userProgress || {});
      if (res.data.topics && res.data.topics.length > 0) {
        loadTopicDetail(res.data.topics[0].topicId);
      } else {
        setSelectedTopic(null);
      }
    } catch {
      toast.error('Failed to load module topics');
    } finally {
      setTopicLoading(false);
    }
  };

  const loadTopicDetail = async (topicId) => {
    try {
      const res = await dsaService.getTopicDetail(topicId);
      setSelectedTopic(res.data.topic);
      if (res.data.progress) {
        setUserProgress((prev) => ({
          ...prev,
          [topicId]: res.data.progress,
        }));
      }
    } catch {
      toast.error('Could not load topic details');
    }
  };

  const toggleCompleted = async (topicId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await dsaService.updateProgress(topicId, { completed: newStatus });
      setUserProgress((prev) => ({
        ...prev,
        [topicId]: { ...(prev[topicId] || {}), completed: newStatus },
      }));
      toast.success(newStatus ? 'Topic completed! Added to your study streak.' : 'Marked as uncompleted');
      loadModules(); // refresh progress %
    } catch {
      toast.error('Could not save progress');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success('Code copied to clipboard!');
  };

  const toggleHint = (qIdx) => {
    setRevealedHints((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Terminal className="w-6 h-6 text-primary-500" />
          DSA Mastery & Problem-Solving Studio
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Structured 14-module roadmap from fundamentals to advanced algorithmic mastery with Java, C++, Python & JS
        </p>
      </div>

      {/* 14 Modules Horizontal Selector */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">14-Stage Learning Roadmap</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {modules.map((mod) => {
            const isSelected = selectedModuleId === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                  <span>M{mod.id}</span>
                  {mod.progressPercent > 0 && (
                    <span className="text-[10px] text-emerald-500 font-semibold">{mod.progressPercent}%</span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1 line-clamp-1 leading-snug">
                  {mod.title.replace(/^Module \d+:\s*/, '')}
                </h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Learning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Topics in Current Module */}
        <div className="lg:col-span-4 space-y-3">
          <div className="card p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              {modules.find((m) => m.id === selectedModuleId)?.title || `Module ${selectedModuleId}`}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {modules.find((m) => m.id === selectedModuleId)?.description}
            </p>

            <div className="space-y-1.5 pt-2">
              {topics.map((t) => {
                const isActive = selectedTopic?.topicId === t.topicId;
                const isCompleted = userProgress[t.topicId]?.completed;

                return (
                  <button
                    key={t.topicId}
                    onClick={() => loadTopicDetail(t.topicId)}
                    className={`w-full p-2.5 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-primary-600 text-white font-semibold shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isCompleted ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'}`} />
                      )}
                      <span className="truncate">{t.title}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {t.difficulty}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Deep-Dive Topic Viewer */}
        <div className="lg:col-span-8">
          {selectedTopic ? (
            <div className="card p-6 md:p-8 space-y-8">
              {/* Topic Header & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                      {selectedTopic.moduleTitle}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      • {selectedTopic.difficulty} Level
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {selectedTopic.title}
                  </h2>
                </div>

                <button
                  onClick={() => toggleCompleted(selectedTopic.topicId, userProgress[selectedTopic.topicId]?.completed)}
                  className={`btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-sm ${
                    userProgress[selectedTopic.topicId]?.completed ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {userProgress[selectedTopic.topicId]?.completed ? 'Completed' : 'Mark as Completed'}
                </button>
              </div>

              {/* 1. Overview & Why It Matters */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">1. Topic Overview & Motivation</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedTopic.overview}
                </p>
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                  <strong>Why it matters for interviews: </strong>{selectedTopic.importance}
                </div>
              </div>

              {/* 2. Conceptual Explanation (English & Hindi) */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">2. Concept Breakdown</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedTopic.conceptEnglish}
                </p>
                {selectedTopic.conceptHindi && (
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    <strong className="text-primary-600">हिंदी विवरण: </strong>{selectedTopic.conceptHindi}
                  </div>
                )}
              </div>

              {/* 3. Complexity Matrix */}
              {selectedTopic.complexity && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">3. Time & Space Complexity</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="card p-3 bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase">Time Complexity</span>
                      <p className="text-base font-bold text-primary-600 mt-1">{selectedTopic.complexity.time}</p>
                    </div>
                    <div className="card p-3 bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase">Space Complexity</span>
                      <p className="text-base font-bold text-indigo-600 mt-1">{selectedTopic.complexity.space}</p>
                    </div>
                    <div className="card p-3 bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase">Best Case</span>
                      <p className="text-sm font-bold text-emerald-600 mt-1">{selectedTopic.complexity.bestCase || 'O(1)'}</p>
                    </div>
                    <div className="card p-3 bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase">Worst Case</span>
                      <p className="text-sm font-bold text-rose-600 mt-1">{selectedTopic.complexity.worstCase || selectedTopic.complexity.time}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Dry Run Visual Table */}
              {selectedTopic.dryRun && selectedTopic.dryRun.steps && selectedTopic.dryRun.steps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">4. Step-by-Step Dry Run Example</h3>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300">
                    Input: <strong>{selectedTopic.dryRun.input}</strong>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                        <tr>
                          <th className="p-2.5">Step</th>
                          <th className="p-2.5">Pointers / State</th>
                          <th className="p-2.5">Algorithmic Decision & Transition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {selectedTopic.dryRun.steps.map((st, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                            <td className="p-2.5 font-bold text-primary-600">{st.step || i + 1}</td>
                            <td className="p-2.5 font-mono text-gray-800 dark:text-gray-200">{st.state}</td>
                            <td className="p-2.5 text-gray-600 dark:text-gray-400">{st.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedTopic.dryRun.output && (
                    <p className="text-xs text-emerald-600 font-semibold pt-1">
                      Output: {selectedTopic.dryRun.output}
                    </p>
                  )}
                </div>
              )}

              {/* 5. Executable Code Implementations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">5. Implementation Code</h3>
                  <div className="flex items-center gap-2">
                    {/* Language Switcher */}
                    <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 text-xs">
                      {[
                        { id: 'java', label: 'Java (Primary)' },
                        { id: 'cpp', label: 'C++' },
                        { id: 'python', label: 'Python' },
                        { id: 'javascript', label: 'JS' },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setActiveLang(lang.id)}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                            activeLang === lang.id
                              ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => copyCode(selectedTopic.codeImplementations?.[activeLang] || '')}
                      className="btn-secondary text-xs p-2 flex items-center gap-1"
                      title="Copy code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <pre className="p-4 rounded-xl bg-gray-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed shadow-lg">
                  {selectedTopic.codeImplementations?.[activeLang] || '// Implementation in progress'}
                </pre>
              </div>

              {/* 6. Line by Line Explanation */}
              {selectedTopic.lineByLineExplanation && selectedTopic.lineByLineExplanation.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">6. Line-by-Line Code Breakdown</h3>
                  <div className="space-y-2">
                    {selectedTopic.lineByLineExplanation.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                        <code className="font-mono text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-950/60 px-2 py-1 rounded sm:w-1/3 truncate">
                          {item.lineOrBlock}
                        </code>
                        <span className="text-gray-600 dark:text-gray-300 flex-1 leading-relaxed">{item.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Common Mistakes & Interview Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTopic.commonMistakes && selectedTopic.commonMistakes.length > 0 && (
                  <div className="card p-4 space-y-2 border-l-4 border-l-rose-500">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600">Common Pitfalls to Avoid</h4>
                    <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 list-disc list-inside">
                      {selectedTopic.commonMistakes.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTopic.practiceProblems && selectedTopic.practiceProblems.length > 0 && (
                  <div className="card p-4 space-y-2 border-l-4 border-l-primary-500">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary-600">Interview Practice Exercises</h4>
                    <ul className="space-y-2 text-xs">
                      {selectedTopic.practiceProblems.map((prob, i) => (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{prob.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            prob.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' : prob.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {prob.difficulty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-sm text-gray-500">
              Select any topic from the module roadmap to begin interactive learning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
