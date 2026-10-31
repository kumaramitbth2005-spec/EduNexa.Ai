import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, ArrowRight,
  Clock, BookOpen, Sparkles, RefreshCw, Layers, Code2, ChevronDown,
  ChevronUp, Target, Star, FileText, Check
} from 'lucide-react';
import { practiceService } from '../../services';
import LoadingScreen from '../../components/common/LoadingScreen';

export default function PracticeReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'incorrect'
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await practiceService.getSessionDetail(id);
      if (res.data.success) {
        setSession(res.data.session);
        // Expand all questions by default
        const initialExpanded = {};
        res.data.session.questions?.forEach((q) => {
          initialExpanded[q.questionId] = true;
        });
        setExpandedQuestions(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to load practice report:', err);
      setError('Failed to load practice evaluation report.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (qId) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  if (loading || !session) return <LoadingScreen />;

  const questions = session.questions || [];
  const correctCount = questions.filter((q) => q.evaluation?.isCorrect).length;
  const incorrectCount = questions.length - correctCount;

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'correct') return q.evaluation?.isCorrect;
    if (filter === 'incorrect') return !q.evaluation?.isCorrect;
    return true;
  });

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  const getGradeBadge = (pct) => {
    if (pct >= 90) return { label: 'Mastery Level: Excellent', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200' };
    if (pct >= 75) return { label: 'Mastery Level: Proficient', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200' };
    if (pct >= 50) return { label: 'Mastery Level: Developing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200' };
    return { label: 'Mastery Level: Needs Focus', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200' };
  };

  const grade = getGradeBadge(session.percentage);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/practice')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Practice Hub</span>
        </button>

        <span className="text-xs text-gray-500">
          Evaluated on {new Date(session.completedAt || session.updatedAt).toLocaleString()}
        </span>
      </div>

      {/* Hero Score & Performance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-indigo-950 to-primary-950 p-8 text-white shadow-xl border border-gray-800">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${grade.color}`}>
              {grade.label}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Evaluation Report: {session.topic}
            </h1>
            <p className="text-indigo-200 text-sm max-w-xl leading-relaxed">
              {session.feedbackSummary || 'Here is your authoritative breakdown and AI evaluation.'}
            </p>
          </div>

          {/* Big Score Ring */}
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full border-4 border-primary-500/30 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md shadow-inner">
              <span className="text-3xl font-black text-white">{session.percentage}%</span>
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Score</span>
            </div>

            <div className="space-y-2 text-xs text-gray-300 font-mono">
              <div>Marks: <strong className="text-white text-sm font-sans">{session.obtainedMarks} / {session.totalMarks}</strong></div>
              <div>Accuracy: <strong className="text-emerald-400 text-sm font-sans">{session.accuracy}%</strong></div>
              <div>Time: <strong className="text-white text-sm font-sans">{formatTime(session.timeSpentSeconds || 0)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Weak & Strong Concept Diagnostic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Strong Areas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-emerald-200 dark:border-emerald-900/40 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Mastered Concepts ({session.strongConcepts?.length || 0})</span>
          </div>
          {session.strongConcepts?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {session.strongConcepts.map((sc, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                  {sc}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Continue practicing to solidify stronger concepts.</p>
          )}
        </div>

        {/* Weak Areas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-200 dark:border-red-900/40 space-y-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Focus & Improvement Areas ({session.weakConcepts?.length || 0})</span>
          </div>
          {session.weakConcepts?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {session.weakConcepts.map((wc, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
                  {wc}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Great job! No critical weak areas detected in this session.</p>
          )}
        </div>
      </div>

      {/* Question Breakdown Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">Question Breakdown:</span>
          <span className="text-xs text-gray-500">({questions.length} total)</span>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'correct' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Correct ({correctCount})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'incorrect' ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Needs Review ({incorrectCount})
          </button>
        </div>
      </div>

      {/* Question-by-Question Deep Dive */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => {
          const evalData = q.evaluation || {};
          const isCorrect = evalData.isCorrect;
          const isExpanded = expandedQuestions[q.questionId] !== false;

          return (
            <div
              key={q.questionId || idx}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all ${
                isCorrect ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-red-200 dark:border-red-900/40'
              }`}
            >
              {/* Question Header */}
              <div
                onClick={() => toggleExpand(q.questionId)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Question {idx + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold capitalize">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 line-clamp-1">
                      {q.question}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                    {evalData.marksObtained || 0} / {q.marks || 1} pts
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Collapsible Body */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-5 text-sm">
                  {/* Full Question Text */}
                  <div className="font-medium text-gray-900 dark:text-white leading-relaxed">
                    {q.question}
                  </div>

                  {/* 1. MCQ Breakdown */}
                  {q.type.startsWith('mcq') && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                        Options & Your Selection:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options?.map((opt) => {
                          const userSelected = q.type === 'mcq_single'
                            ? (q.userAnswer?.selectedOption === opt.id || q.userAnswer === opt.id)
                            : (q.userAnswer?.selectedOptions || []).includes(opt.id);

                          const isAnswerCorrect = opt.isCorrect;

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                isAnswerCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                                  : userSelected
                                  ? 'bg-red-50 dark:bg-red-900/30 border-red-300 text-red-900 dark:text-red-200'
                                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{opt.text}</span>
                              </div>
                              <div className="flex items-center gap-2 font-semibold">
                                {userSelected && <span className="text-xs">(Your Choice)</span>}
                                {isAnswerCorrect && <span className="text-xs text-emerald-600 font-bold">✓ Correct Answer</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Written & Conceptual Breakdown */}
                  {(q.type === 'conceptual' || q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'scenario') && (
                    <div className="space-y-4 pt-1">
                      {/* Student's answer */}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                          Your Answer:
                        </span>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {q.userAnswer?.textAnswer || q.userAnswer || 'No answer submitted.'}
                        </p>
                      </div>

                      {/* Model Answer */}
                      {q.modelAnswer && (
                        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
                            Model Reference Solution:
                          </span>
                          <p className="text-indigo-900 dark:text-indigo-200 whitespace-pre-wrap leading-relaxed">
                            {q.modelAnswer}
                          </p>
                        </div>
                      )}

                      {/* Rubric Breakdown */}
                      {evalData.rubricScores?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                            Rubric Evaluation Breakdown:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {evalData.rubricScores.map((rb, rbIdx) => (
                              <div key={rbIdx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                                <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                                  <span>{rb.criterion}</span>
                                  <span className="text-primary-600">{rb.awarded} / {rb.max}</span>
                                </div>
                                {rb.comment && <p className="text-gray-500 dark:text-gray-400 mt-1">{rb.comment}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Coding Breakdown */}
                  {q.type === 'coding' && (
                    <div className="space-y-4 pt-1">
                      {/* Code submitted */}
                      <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
                        <div className="bg-gray-900 px-4 py-2 text-xs font-mono text-gray-400 border-b border-gray-800 flex justify-between">
                          <span>Submitted Code ({q.userAnswer?.language || 'python'})</span>
                          <span className="text-emerald-400">Automated Verification</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                          {q.userAnswer?.codeAnswer || '// No code submitted'}
                        </pre>
                      </div>

                      {/* Test cases result */}
                      {evalData.testCaseResults?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                            Test Cases Execution:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {evalData.testCaseResults.map((tc, tcIdx) => (
                              <div
                                key={tcIdx}
                                className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                                  tc.passed
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-red-50 dark:bg-red-900/30 border-red-300 text-red-800 dark:text-red-200'
                                }`}
                              >
                                <div>
                                  <div>Input: {tc.input || '[]'}</div>
                                  <div>Expected: {tc.expected || '[]'}</div>
                                </div>
                                <span className="font-bold">
                                  {tc.passed ? '✓ PASSED' : '✗ FAILED'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Feedback & Explanation */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                      <span>Evaluator Diagnostic:</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {evalData.feedback || q.explanation || 'Reviewed against conceptual standards.'}
                    </p>

                    {evalData.improvementTips?.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
                        <span className="font-semibold text-primary-600 block">How to Improve:</span>
                        {evalData.improvementTips.map((tip, tIdx) => (
                          <div key={tIdx} className="text-gray-600 dark:text-gray-400">• {tip}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/practice')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back to Practice Hub
        </button>

        <button
          onClick={() => navigate(`/practice?topic=${encodeURIComponent(session.topic)}`)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Practice This Topic Again</span>
        </button>
      </div>
    </div>
  );
}

