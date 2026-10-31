import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  HelpCircle, Clock, CheckCircle2, XCircle, AlertTriangle,
  Award, ArrowLeft, ArrowRight, Flag, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Test State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 mins in seconds
  const [submitting, setSubmitting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Post-submission Results
  const [results, setResults] = useState(null);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all'); // all, incorrect, correct

  useEffect(() => {
    fetchAssessmentData();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!isStarted || results || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, results, timeLeft]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourseAssessment(id);
      setAssessment(res.data.assessment);
      setUserStatus(res.data.userStatus);
      setTimeLeft((res.data.assessment?.durationMinutes || 60) * 60);
    } catch (err) {
      toast.error('Failed to load course assessment.');
      navigate(`/courses/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const toggleFlag = (questionId) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitAssessment = async () => {
    if (submitting) return;
    const totalQ = assessment?.questions?.length || 50;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < totalQ) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalQ} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      const timeTaken = (assessment?.durationMinutes * 60) - timeLeft;
      const res = await courseService.submitCourseAssessment(id, {
        answers: selectedAnswers,
        timeTaken: Math.max(timeTaken, 10),
      });

      toast.success(res.data.message || 'Assessment submitted!');
      setResults(res.data.summary);
      setReviewQuestions(res.data.reviewQuestions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="skeleton h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const questions = assessment?.questions || [];
  const currentQ = questions[currentIdx];

  // ── SCREEN 1: Results & Deep Review Screen ──
  if (results) {
    const isPassed = results.isPassed;
    const filteredReview = reviewQuestions.filter((q) => {
      if (reviewFilter === 'incorrect') return !q.isCorrect;
      if (reviewFilter === 'correct') return q.isCorrect;
      return true;
    });

    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-fade-in pb-16">
        {/* Result Header Banner */}
        <div className={`card p-8 text-center space-y-4 border-2 ${isPassed ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${isPassed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'}`}>
            {isPassed ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
          </div>

          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPassed ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
              {isPassed ? 'Assessment Passed (Certified)' : 'Passing Threshold Not Reached'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {isPassed ? 'Congratulations on Passing Your Final Assessment!' : 'Attempt Completed — Review Weak Concepts'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Required Score: 70% (35/50) • Your Score: <span className="font-bold text-gray-800 dark:text-gray-200">{results.percentage}% ({results.correctCount}/50)</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-center">
              <span className="text-[11px] text-gray-400">Total MCQs</span>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{results.totalQuestions}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
              <span className="text-[11px] text-emerald-600">Correct Answers</span>
              <div className="text-xl font-bold text-emerald-600">{results.correctCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-center">
              <span className="text-[11px] text-red-600">Incorrect</span>
              <div className="text-xl font-bold text-red-600">{results.incorrectCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-center">
              <span className="text-[11px] text-purple-600">Final Grade</span>
              <div className="text-xl font-bold text-purple-600">{results.percentage}%</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            {isPassed ? (
              <Link
                to={`/courses/${id}/certificate`}
                className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
              >
                <Award className="w-4 h-4" />
                Claim Verified Certificate
              </Link>
            ) : (
              <button
                onClick={() => {
                  setResults(null);
                  setSelectedAnswers({});
                  setIsStarted(true);
                  setTimeLeft((assessment?.durationMinutes || 60) * 60);
                }}
                className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake Assessment
              </button>
            )}
            <Link to={`/courses/${id}/learn`} className="btn-secondary py-3 px-6 text-sm">
              Review Course Topics
            </Link>
          </div>
        </div>

        {/* Topic-Wise Breakdown & Recommendations */}
        {results.topicAnalysis?.length > 0 && (
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Topic-Wise Competency Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.topicAnalysis.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    t.isWeak
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-900 dark:text-white">{t.topic}</span>
                    <span className={t.isWeak ? 'text-amber-600' : 'text-emerald-600'}>
                      {t.correct} / {t.total} ({t.accuracy}%)
                    </span>
                  </div>
                  <ProgressBar value={t.accuracy} color={t.isWeak ? 'amber' : 'green'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 50 Questions Detailed Review */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Comprehensive 50-Question Solution Review
            </h3>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold ${reviewFilter === 'all' ? 'bg-primary-600 text-white' : 'text-gray-500'}`}
              >
                All (50)
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`px-2.5 py-1 rounded-md font-semibold ${reviewFilter === 'incorrect' ? 'bg-red-600 text-white' : 'text-gray-500'}`}
              >
                Incorrect ({results.incorrectCount})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-2.5 py-1 rounded-md font-semibold ${reviewFilter === 'correct' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}
              >
                Correct ({results.correctCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReview.map((q, idx) => (
              <div
                key={q._id}
                className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                  q.isCorrect ? 'bg-gray-50/60 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700' : 'bg-red-50/30 dark:bg-red-950/15 border-red-300 dark:border-red-900/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-bold text-primary-600">Question #{idx + 1} • {q.topic}</span>
                  <span className={q.isCorrect ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                    {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{q.text}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = q.selectedOptionId === opt._id;
                    const isCorrect = opt.isCorrect;
                    let optStyle = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300';
                    if (isCorrect) optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold';
                    else if (isSelected && !isCorrect) optStyle = 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 line-through';

                    return (
                      <div key={opt._id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${optStyle}`}>
                        <span>{opt.text}</span>
                        {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 text-[11px] text-blue-900 dark:text-blue-300">
                  <span className="font-bold">Explanation:</span> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: Test Start Splash Page ──
  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
        <div className="card p-8 space-y-6 text-center border-2 border-primary-500/20 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-9 h-9" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-900/30 text-purple-600">
              Mandatory Final Examination
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {assessment?.title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-lg mx-auto">
              50 comprehensive multiple-choice questions covering all modules. A passing score of 70% (35/50) unlocks your verified graduation certificate.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-xs text-left border border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-gray-400">Total Questions:</span>
              <div className="font-bold text-gray-900 dark:text-white text-sm">50 MCQs</div>
            </div>
            <div>
              <span className="text-gray-400">Duration:</span>
              <div className="font-bold text-gray-900 dark:text-white text-sm">60 Minutes</div>
            </div>
            <div>
              <span className="text-gray-400">Pass Criteria:</span>
              <div className="font-bold text-emerald-600 text-sm">70% (35 Marks)</div>
            </div>
          </div>

          {userStatus?.hasAttempted && (
            <div className={`p-3 rounded-xl border text-xs ${userStatus.hasPassed ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700'}`}>
              Previous Attempt Score: <strong>{userStatus.latestPercentage}% ({userStatus.latestScore}/50)</strong> — {userStatus.hasPassed ? 'Certified Passed' : 'Below 70% threshold'}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setIsStarted(true)}
              className="btn-primary w-full py-3.5 text-base rounded-xl font-bold shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
            >
              Start 50-Question Assessment
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link to={`/courses/${id}`} className="block text-xs text-gray-500 hover:underline">
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: Live Active 50-MCQ Exam Environment ──
  const answeredCount = Object.keys(selectedAnswers).length;
  const isFlagged = currentQ ? !!flagged[currentQ._id] : false;

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4 space-y-4 animate-fade-in pb-16">
      {/* Top Test Bar: Timer & Actions */}
      <div className="card p-4 flex items-center justify-between sticky top-2 z-30 shadow-md backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold text-xs">
            Q{currentIdx + 1} of {questions.length}
          </span>
          <span className="text-xs text-gray-500 hidden sm:inline">
            Answered: {answeredCount} / {questions.length}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-mono font-bold text-gray-900 dark:text-white">
          <Clock className="w-4 h-4 text-primary-600 animate-pulse" />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <button
          onClick={handleSubmitAssessment}
          disabled={submitting}
          className="btn-primary text-xs py-2 px-4 shadow-md shadow-primary-500/30"
        >
          {submitting ? 'Submitting...' : 'Finish & Submit Exam'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Active Question Display */}
        <div className="lg:col-span-3 card p-6 space-y-6 flex flex-col justify-between min-h-[460px]">
          {currentQ && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
                <span>Topic: {currentQ.topic || 'Curriculum Invariants'}</span>
                <button
                  onClick={() => toggleFlag(currentQ._id)}
                  className={`flex items-center gap-1 font-semibold ${isFlagged ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {isFlagged ? 'Flagged for Review' : 'Flag Question'}
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                {currentIdx + 1}. {currentQ.text}
              </h2>

              {/* 4 Single-Choice Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options?.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQ._id] === opt._id;
                  return (
                    <button
                      key={opt._id}
                      onClick={() => handleSelectOption(currentQ._id, opt._id)}
                      className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/80 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nav Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(prev - 1, 0))}
              disabled={currentIdx === 0}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <button
              onClick={() => setCurrentIdx((prev) => Math.min(prev + 1, questions.length - 1))}
              disabled={currentIdx === questions.length - 1}
              className="btn-secondary text-xs py-2 px-4 flex items-center gap-1"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: 50-Question Navigation Palette */}
        <div className="card p-4 space-y-3 h-fit">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">
            50-Question Palette
          </h3>

          <div className="grid grid-cols-5 gap-1.5 max-h-[360px] overflow-y-auto scrollbar-thin p-1">
            {questions.map((q, idx) => {
              const isAns = !!selectedAnswers[q._id];
              const isCur = idx === currentIdx;
              const isFlg = !!flagged[q._id];

              let color = 'bg-gray-100 dark:bg-gray-800 text-gray-500';
              if (isCur) color = 'ring-2 ring-primary-600 font-bold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300';
              else if (isAns) color = 'bg-emerald-500 text-white font-bold';
              else if (isFlg) color = 'bg-amber-400 text-gray-900 font-bold';

              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-full aspect-square rounded-lg text-xs flex items-center justify-center transition-all ${color}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] space-y-1 text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Answered
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Flagged
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-gray-200 dark:bg-gray-700" /> Unvisited
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
