import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  Clock, AlertTriangle, CheckCircle, Flag, ChevronLeft,
  ChevronRight, Send, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOption, textAnswer } }
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [startTime] = useState(Date.now());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchExam();
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const res = await examService.getExam(id);
      setExam(res.data.exam);
      const totalSecs = (res.data.exam.duration || 30) * 60;
      setTimeLeft(totalSecs);
      startTimer(totalSecs);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load examination');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (initialSecs) => {
    let remaining = initialSecs;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        toast.error('Time has expired! Automatically submitting your responses...');
        autoSubmit();
      }
    }, 1000);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = exam?.questions ? exam.questions[currentIdx] : null;

  const handleSelectOption = (optId) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: {
        question: currentQ._id,
        selectedOption: optId,
      },
    }));
  };

  const handleTextAnswer = (text) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: {
        question: currentQ._id,
        textAnswer: text,
      },
    }));
  };

  const toggleMarkForReview = () => {
    if (!currentQ) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ._id)) next.delete(currentQ._id);
      else next.add(currentQ._id);
      return next;
    });
  };

  const autoSubmit = () => {
    handleSubmitConfirmed();
  };

  const handleSubmitConfirmed = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const formattedAnswers = Object.values(answers);
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      const res = await examService.submitExam(id, {
        answers: formattedAnswers,
        timeTaken,
        startedAt: new Date(startTime).toISOString(),
      });

      toast.success('Examination submitted successfully!');
      navigate(`/exams/${id}/result`, { state: { result: res.data.result } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit examination');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Preparing examination environment...</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam?.questions?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Exam Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h2 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">{exam?.title}</h2>
          <p className="text-xs text-gray-400">Total Marks: {exam?.totalMarks} pts • Questions: {totalQuestions}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-sm border ${
            timeLeft < 300
              ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/50 animate-pulse'
              : 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-950/50'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-primary-500/25"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Exam Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
          {currentQ && (
            <div className="card p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                  Question {currentIdx + 1} of {totalQuestions}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {currentQ.marks || 1} Point(s)
                </span>
              </div>

              {/* Question Text */}
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                {currentQ.text}
              </h3>

              {/* Options */}
              {currentQ.type === 'mcq' || currentQ.type === 'true-false' ? (
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isSelected = answers[currentQ._id]?.selectedOption === opt._id;
                    return (
                      <div
                        key={opt._id}
                        onClick={() => handleSelectOption(opt._id)}
                        className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-950/50 border-primary-500 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                            : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-primary-600" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-2">
                  <textarea
                    rows={6}
                    value={answers[currentQ._id]?.textAnswer || ''}
                    onChange={(e) => handleTextAnswer(e.target.value)}
                    placeholder="Type your detailed explanation or answer here..."
                    className="input text-sm font-sans"
                  />
                </div>
              )}

              {/* Bottom Nav Buttons */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={toggleMarkForReview}
                  className={`btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 ${
                    markedForReview.has(currentQ._id) ? '!border-amber-400 !text-amber-500 bg-amber-50 dark:bg-amber-950/30' : ''
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {markedForReview.has(currentQ._id) ? 'Marked for Review' : 'Mark for Review'}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((i) => i - 1)}
                    className="btn-secondary text-xs px-4 py-2 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    disabled={currentIdx === totalQuestions - 1}
                    onClick={() => setCurrentIdx((i) => i + 1)}
                    className="btn-primary text-xs px-5 py-2 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right: Question Navigator Panel */}
        <aside className="w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hidden lg:flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Question Navigator
            </h4>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary-600" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span>Review</span>
              </div>
            </div>

            {/* Question Buttons Matrix */}
            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto p-1 scrollbar-thin">
              {exam?.questions?.map((q, idx) => {
                const isAnswered = !!answers[q._id];
                const isReview = markedForReview.has(q._id);
                const isCurrent = currentIdx === idx;

                let btnClass = 'w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ';
                if (isCurrent) btnClass += 'ring-2 ring-primary-500 ring-offset-2 ';

                if (isReview) {
                  btnClass += 'bg-amber-400 text-white';
                } else if (isAnswered) {
                  btnClass += 'bg-primary-600 text-white';
                } else {
                  btnClass += 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200';
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIdx(idx)}
                    className={btnClass}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary w-full text-xs py-2.5 font-bold"
            >
              Finish & Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        title="Submit Examination?"
        message={`You have answered ${answeredCount} of ${totalQuestions} questions. Are you ready to submit for evaluation?`}
        confirmLabel="Yes, Submit"
        cancelLabel="Continue Exam"
        onConfirm={handleSubmitConfirmed}
        onCancel={() => setShowSubmitModal(false)}
        isLoading={submitting}
      />
    </div>
  );
}

