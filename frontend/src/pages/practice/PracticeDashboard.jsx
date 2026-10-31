import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Zap, Brain, Target, Award, ArrowRight, Sparkles, BookOpen, Clock,
  CheckCircle2, AlertTriangle, TrendingUp, RefreshCw, Play, Filter,
  Layers, Code2, HelpCircle, FileText, Search, Star
} from 'lucide-react';
import { practiceService } from '../../services';
import LoadingScreen from '../../components/common/LoadingScreen';

const popularTopics = [
  { topic: 'Java Inheritance & Polymorphism', subject: 'Java / OOP', category: 'all' },
  { topic: 'Binary Search Trees & Traversals', subject: 'Data Structures', category: 'coding' },
  { topic: 'Deadlock Detection & Prevention', subject: 'Operating Systems', category: 'conceptual' },
  { topic: 'Database Normalization (1NF to BCNF)', subject: 'DBMS', category: 'conceptual' },
  { topic: 'TCP 3-Way Handshake & Flow Control', subject: 'Computer Networks', category: 'scenario' },
  { topic: 'React Hooks & State Lifecycle', subject: 'Web Development', category: 'all' },
];

export default function PracticeDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [topic, setTopic] = useState(initialTopic);
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('medium');
  const [mode, setMode] = useState('practice');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, sessionsRes] = await Promise.all([
        practiceService.getAnalytics(),
        practiceService.getSessions({ limit: 10 }),
      ]);
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
      if (sessionsRes.data.success) {
        setSessions(sessionsRes.data.sessions);
      }
    } catch (err) {
      console.error('Error fetching practice dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (customTopic = null, customCategory = null) => {
    const targetTopic = customTopic || topic;
    const targetCategory = customCategory || category;

    if (!targetTopic || !targetTopic.trim()) {
      setError('Please enter or select a topic to practice.');
      return;
    }

    try {
      setError('');
      setGenerating(true);
      const res = await practiceService.generatePractice({
        topic: targetTopic.trim(),
        category: targetCategory,
        difficulty,
        mode,
        count: Number(count),
      });

      if (res.data.success && res.data.session?._id) {
        navigate(`/practice/session/${res.data.session._id}`);
      }
    } catch (err) {
      console.error('Failed to generate practice:', err);
      setError(err.response?.data?.message || 'Failed to generate practice session. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !analytics) {
    return <LoadingScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero & Generation Studio Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-semibold tracking-wide uppercase text-white">
            <Zap className="w-4 h-4 text-yellow-300" />
            AI Adaptive Practice & Evaluation System
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Learn Better. Practice Smarter. Build Mastery.
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg leading-relaxed">
            Search or select any topic in your curriculum or coding roadmap. EduNexa's AI understands the subject, automatically synthesizes topic-aware MCQs, conceptual questions, rubric-scored written answers, and coding tasks with automated verification.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Brain className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Main Topic Practice Generator Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start a Practice Session</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target any academic, DSA, or engineering topic</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            What topic would you like to practice today?
          </label>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g., Java Inheritance, Dynamic Programming Knapsack, Virtual Memory Paging, SQL Joins..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Popular Topics Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Popular:</span>
            {popularTopics.map((pt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(pt.topic);
                  setCategory(pt.category);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                {pt.topic}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
              Practice Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">🎯 Mixed (MCQ, Concepts, Code, Scenario)</option>
              <option value="mcq">🔘 MCQs & Multi-Select Only</option>
              <option value="conceptual">💡 Conceptual & Deep Theory</option>
              <option value="written">✍️ Written Descriptive with Rubrics</option>
              <option value="coding">💻 Coding Problems & Test Cases</option>
              <option value="scenario">🏢 Real-World Engineering Scenarios</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              {['easy', 'medium', 'hard'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    difficulty === lvl
                      ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
              Practice Mode
            </label>
            <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('practice')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'practice'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Learning Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('assessment')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'assessment'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Assessment
              </button>
            </div>
          </div>

          {/* Questions Count */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
              Questions Count
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value={3}>3 Questions (Express)</option>
              <option value={5}>5 Questions (Standard)</option>
              <option value={8}>8 Questions (In-depth)</option>
              <option value={10}>10 Questions (Comprehensive)</option>
            </select>
          </div>
        </div>

        {/* Generate CTA Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={generating}
            onClick={() => handleGenerate()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>AI Generating Practice Questions...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Generate & Start Practice</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Adaptive Analytics & Recommendations */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Recommendations & Weak Area Drills */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recommended For You</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 font-medium">
                  AI Adaptive Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analytics.recommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleGenerate(rec.topic, rec.suggestedCategory)}
                    className="group cursor-pointer p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                          {rec.suggestedCategory || 'Practice'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {rec.reason}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                      <span>Topic: {rec.topic}</span>
                      <span className="font-medium text-primary-600 dark:text-primary-400">Start Drill →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak vs Strong Concept Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Weak Concepts */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-red-200 dark:border-red-900/50">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Topics Needing Practice</span>
                </div>
                {analytics.weakTopics && analytics.weakTopics.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.weakTopics.map((wt, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{wt.topic}</span>
                          <span className="text-xs font-bold text-red-600">{wt.accuracy}% acc</span>
                        </div>
                        {wt.weakConcepts?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {wt.weakConcepts.map((c, cIdx) => (
                              <span key={cIdx} className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleGenerate(wt.topic, 'conceptual')}
                          className="mt-2 text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
                        >
                          Targeted Drill <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No weak areas detected! Keep practicing diverse topics.</p>
                )}
              </div>

              {/* Strong Concepts */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-emerald-200 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Mastered Topics</span>
                </div>
                {analytics.strongTopics && analytics.strongTopics.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.strongTopics.map((st, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{st.topic}</span>
                          <span className="text-xs font-bold text-emerald-600">{st.accuracy}% acc</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                          <span>Level: <strong className="text-emerald-600">{st.masteryLevel}</strong></span>
                          <button
                            onClick={() => handleGenerate(st.topic, 'coding')}
                            className="font-medium text-emerald-700 hover:underline"
                          >
                            Hard Coding Drill →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Complete more sessions to build mastered topics.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Performance Summary Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Practice Performance
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-xs text-gray-500">Sessions</span>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analytics.totalSessions || 0}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-xs text-gray-500">Time Practiced</span>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analytics.totalTimeMinutes || 0}m
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-xs text-gray-500">Average Score</span>
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                    {analytics.avgScore || 0}%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-xs text-gray-500">Average Accuracy</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {analytics.avgAccuracy || 0}%
                  </div>
                </div>
              </div>

              {/* Topic Mastery List */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Topic Mastery Matrix
                </h4>
                {analytics.masteries && analytics.masteries.length > 0 ? (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {analytics.masteries.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[140px]">{m.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.masteryLevel === 'Master' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                            m.masteryLevel === 'Proficient' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                            m.masteryLevel === 'Developing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                            'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                          }`}>
                            {m.masteryLevel}
                          </span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">{m.accuracyPercentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Generate your first practice session above to unlock your mastery matrix.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Sessions History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Practice Sessions</h3>
          </div>
          <span className="text-xs text-gray-500">{sessions.length} total sessions</span>
        </div>

        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3.5">Topic</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Difficulty</th>
                  <th className="px-6 py-3.5">Status / Score</th>
                  <th className="px-6 py-3.5">Accuracy</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((sess) => (
                  <tr key={sess._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {sess.topic}
                    </td>
                    <td className="px-6 py-4 uppercase text-xs font-semibold text-gray-500">
                      {sess.category}
                    </td>
                    <td className="px-6 py-4 capitalize text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        sess.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                        sess.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        {sess.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sess.status === 'completed' ? (
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {sess.obtainedMarks} / {sess.totalMarks} ({sess.percentage}%)
                        </span>
                      ) : (
                        <span className="text-amber-500 font-medium">In Progress</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sess.status === 'completed' ? (
                        <span className="font-bold text-gray-800 dark:text-gray-200">{sess.accuracy}%</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(sess.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sess.status === 'completed' ? (
                        <button
                          onClick={() => navigate(`/practice/report/${sess._id}`)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
                        >
                          View Report
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/practice/session/${sess._id}`)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                        >
                          Resume
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No practice sessions recorded yet. Start your first session above!
          </div>
        )}
      </div>
    </div>
  );
}

