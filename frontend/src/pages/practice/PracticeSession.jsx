import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, HelpCircle,
  Lightbulb, Code2, Play, RefreshCw, Send, Check, ShieldAlert, BookOpen,
  ChevronRight, Award, Zap
} from 'lucide-react';
import { practiceService } from '../../services';
import LoadingScreen from '../../components/common/LoadingScreen';

export default function PracticeSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [codingLanguages, setCodingLanguages] = useState({});
  const [showHint, setShowHint] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState('');

  // Fetch session
  useEffect(() => {
    fetchSession();
  }, [id]);

  // Timer ticker
  useEffect(() => {
    if (!session || session.status === 'completed') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await practiceService.getSessionDetail(id);
      if (res.data.success) {
        const sess = res.data.session;
        setSession(sess);

        // If already completed, redirect to report
        if (sess.status === 'completed') {
          navigate(`/practice/report/${sess._id}`, { replace: true });
          return;
        }

        // Initialize user answers from existing if any
        const initialAnswers = {};
        const initialLanguages = {};
        sess.questions.forEach((q) => {
          if (q.userAnswer !== undefined) {
            initialAnswers[q.questionId] = q.userAnswer;
          }
          if (q.type === 'coding') {
            initialLanguages[q.questionId] = 'python';
            // Preload starter code if no answer yet
            if (!initialAnswers[q.questionId] && q.codingDetails?.starterCode?.python) {
              initialAnswers[q.questionId] = {
                codeAnswer: q.codingDetails.starterCode.python,
                language: 'python',
              };
            }
          }
        });
        setAnswers(initialAnswers);
        setCodingLanguages(initialLanguages);
        setElapsedSeconds(sess.timeSpentSeconds || 0);
      }
    } catch (err) {
      console.error('Failed to load practice session:', err);
      setError('Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedOption: optionId },
    }));
  };

  const handleToggleMultiOption = (questionId, optionId) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.selectedOptions || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return {
        ...prev,
        [questionId]: { selectedOptions: updated },
      };
    });
  };

  const handleTextAnswerChange = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { textAnswer: text },
    }));
  };

  const handleCodeChange = (questionId, code) => {
    const lang = codingLanguages[questionId] || 'python';
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { codeAnswer: code, language: lang },
    }));
  };

  const handleLanguageChange = (questionId, newLang) => {
    setCodingLanguages((prev) => ({ ...prev, [questionId]: newLang }));
    const currentQ = session.questions.find((q) => q.questionId === questionId);
    const starter = currentQ?.codingDetails?.starterCode?.[newLang] || '';
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { codeAnswer: starter, language: newLang },
    }));
  };

  const isQuestionAnswered = (q) => {
    const ans = answers[q.questionId];
    if (!ans) return false;
    if (q.type === 'mcq_single') return !!ans.selectedOption;
    if (q.type === 'mcq_multi') return Array.isArray(ans.selectedOptions) && ans.selectedOptions.length > 0;
    if (q.type === 'coding') return !!ans.codeAnswer && ans.codeAnswer.trim().length > 10;
    return !!ans.textAnswer && ans.textAnswer.trim().length > 0;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      const res = await practiceService.submitPractice(id, {
        answers,
        timeSpentSeconds: elapsedSeconds,
      });

      if (res.data.success) {
        navigate(`/practice/report/${id}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to submit practice session:', err);
      setError(err.response?.data?.message || 'Failed to submit practice session.');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (loading || !session) return <LoadingScreen />;

  const currentQ = session.questions[currentIndex];
  const totalQuestions = session.questions.length;
  const answeredCount = session.questions.filter(isQuestionAnswered).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate('/practice')}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wide">
                {session.subject}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                session.mode === 'assessment' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                {session.mode === 'assessment' ? 'Assessment Mode' : 'Learning Mode'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {session.topic}
            </h1>
          </div>
        </div>

        {/* Timer & Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-mono text-base font-bold bg-gray-50 dark:bg-gray-700/60 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600">
            <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {answeredCount} / {totalQuestions} Answered
              </div>
              <div className="w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Finish & Submit</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Practice Workspace: Split into Question Navigator Sidebar & Active Question Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Question Navigator */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
            Question Navigator
          </h3>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
            {session.questions.map((q, idx) => {
              const answered = isQuestionAnswered(q);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full aspect-square rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center relative ${
                    isCurrent
                      ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-400'
                      : answered
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {answered && !isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-primary-600" />
              <span>Current Question</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>

        {/* Right Column (3 Cols): Active Question Card */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
            {/* Header: Type and Marks */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold capitalize">
                  {currentQ.type.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Marks: <strong className="text-primary-600 dark:text-primary-400">{currentQ.marks || 1}</strong>
              </div>
            </div>

            {/* Context (if any) */}
            {currentQ.context && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Scenario / Context:</span>
                {currentQ.context}
              </div>
            )}

            {/* Question Text */}
            <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </div>

            {/* Hints Box (in learning mode) */}
            {session.mode !== 'assessment' && currentQ.hints?.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => ({ ...prev, [currentQ.questionId]: !prev[currentQ.questionId] }))}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{showHint[currentQ.questionId] ? 'Hide Hint' : 'Show AI Hint'}</span>
                </button>
                {showHint[currentQ.questionId] && (
                  <div className="mt-2 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    {currentQ.hints.map((h, hIdx) => (
                      <p key={hIdx}>• {h}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. MCQ Single Selection */}
            {currentQ.type === 'mcq_single' && (
              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt) => {
                  const isSelected = answers[currentQ.questionId]?.selectedOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.questionId, opt.id)}
                      className={`cursor-pointer p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/60 dark:bg-primary-900/30 text-primary-900 dark:text-white shadow-sm ring-1 ring-primary-500'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/20 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="flex-1 leading-normal">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. MCQ Multi Selection */}
            {currentQ.type === 'mcq_multi' && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  Select all that apply:
                </p>
                {currentQ.options?.map((opt) => {
                  const isChecked = (answers[currentQ.questionId]?.selectedOptions || []).includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleMultiOption(currentQ.questionId, opt.id)}
                      className={`cursor-pointer p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-4 ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/30 text-indigo-900 dark:text-white shadow-sm ring-1 ring-indigo-500'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/20 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                        isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="flex-1 leading-normal">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Conceptual & Descriptive Written Answer */}
            {(currentQ.type === 'conceptual' || currentQ.type === 'short_answer' || currentQ.type === 'long_answer' || currentQ.type === 'scenario') && (
              <div className="space-y-4 pt-2">
                {/* Rubric Peek */}
                {currentQ.rubric?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
                    <span className="font-bold uppercase tracking-wider block mb-1">
                      Evaluator Rubric Criteria:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      {currentQ.rubric.map((r, rIdx) => (
                        <div key={rIdx} className="p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                          <strong className="block text-gray-900 dark:text-white">{r.criterion} ({r.marks} pts)</strong>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{r.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    Your Written Response:
                  </label>
                  <textarea
                    rows={7}
                    value={answers[currentQ.questionId]?.textAnswer || ''}
                    onChange={(e) => handleTextAnswerChange(currentQ.questionId, e.target.value)}
                    placeholder="Type your structured explanation here. Cite principles, examples, trade-offs, and edge cases for full marks..."
                    className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all leading-relaxed font-sans"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1.5 px-1">
                    <span>Evaluated by EduNexa AI with Rubric Verification</span>
                    <span>
                      {(answers[currentQ.questionId]?.textAnswer || '').trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Coding Problem Implementation */}
            {currentQ.type === 'coding' && (
              <div className="space-y-4 pt-2">
                {/* Problem Specs & Constraints */}
                {currentQ.codingDetails && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    {currentQ.codingDetails.problemStatement && (
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentQ.codingDetails.problemStatement}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      {currentQ.codingDetails.inputFormat && (
                        <div><strong>Input:</strong> {currentQ.codingDetails.inputFormat}</div>
                      )}
                      {currentQ.codingDetails.outputFormat && (
                        <div><strong>Output:</strong> {currentQ.codingDetails.outputFormat}</div>
                      )}
                      {currentQ.codingDetails.constraints && (
                        <div><strong>Constraints:</strong> {currentQ.codingDetails.constraints}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Language Selector Bar */}
                <div className="flex items-center justify-between bg-gray-900 px-4 py-2.5 rounded-t-xl border-b border-gray-800 text-white">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Code Editor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Language:</span>
                    <select
                      value={codingLanguages[currentQ.questionId] || 'python'}
                      onChange={(e) => handleLanguageChange(currentQ.questionId, e.target.value)}
                      className="bg-gray-800 text-xs text-white border border-gray-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="python">Python 3</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript (Node)</option>
                      <option value="cpp">C++ (g++)</option>
                    </select>
                  </div>
                </div>

                {/* Editor Textarea */}
                <textarea
                  rows={12}
                  value={answers[currentQ.questionId]?.codeAnswer || ''}
                  onChange={(e) => handleCodeChange(currentQ.questionId, e.target.value)}
                  placeholder="Write your code solution here..."
                  className="w-full -mt-4 p-4 rounded-b-xl border border-gray-800 bg-gray-950 text-emerald-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
                  spellCheck={false}
                />

                {/* Test cases sample */}
                {currentQ.codingDetails?.testCases?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      Sample Test Cases:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentQ.codingDetails.testCases.map((tc, tcIdx) => (
                        <div key={tcIdx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs font-mono border border-gray-200 dark:border-gray-700">
                          <div><span className="text-gray-500">Input:</span> {tc.input || '[]'}</div>
                          <div><span className="text-gray-500">Expected:</span> {tc.expectedOutput || '[]'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Question Step Navigation */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs font-medium text-gray-500">
                Question {currentIndex + 1} of {totalQuestions}
              </div>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold shadow-md transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Practice</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 mx-auto">
              <Award className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Submit Practice Session?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You have answered <strong>{answeredCount} of {totalQuestions}</strong> questions.
                {answeredCount < totalQuestions && (
                  <span className="text-amber-600 block mt-1">
                    You still have {totalQuestions - answeredCount} unanswered questions.
                  </span>
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div>• Time spent: <strong>{formatTime(elapsedSeconds)}</strong></div>
              <div>• Authoritative grading and Gemini rubric evaluations will be executed immediately.</div>
              <div>• Your mastery matrix for <strong>{session.topic}</strong> will be updated.</div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Keep Practicing
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

