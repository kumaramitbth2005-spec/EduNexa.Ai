import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { examService } from '../../services';
import {
  Award, CheckCircle2, XCircle, Clock, ArrowRight,
  RotateCcw, Check, X, HelpCircle, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamResult() {
  const { id } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result) {
      fetchLatestResult();
    }
  }, [id]);

  const fetchLatestResult = async () => {
    try {
      setLoading(true);
      const res = await examService.getExamResults(id);
      if (res.data.results?.length > 0) {
        setResult(res.data.results[0]);
      }
    } catch (err) {
      toast.error('Failed to load exam result details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Calculating your performance metrics...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card p-12 text-center">
        <h3 className="text-lg font-bold">No result record found</h3>
        <Link to="/exams" className="btn-primary text-xs mt-4 inline-block">Back to Exams</Link>
      </div>
    );
  }

  const isPassed = result.isPassed;
  const timeMins = result.timeTaken ? Math.floor(result.timeTaken / 60) : 0;
  const timeSecs = result.timeTaken ? result.timeTaken % 60 : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Score Summary Card */}
      <div className="card p-8 text-center relative overflow-hidden shadow-xl">
        <div className="max-w-md mx-auto space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-primary-50 dark:bg-primary-950/50 mb-2">
            {isPassed ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            ) : (
              <XCircle className="w-16 h-16 text-rose-500" />
            )}
          </div>

          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
          }`}>
            {isPassed ? 'Passed Examination' : 'Needs Improvement'}
          </span>

          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            {result.percentage}%
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            You scored <strong className="text-gray-900 dark:text-white">{result.obtainedMarks}</strong> out of{' '}
            <strong>{result.totalMarks}</strong> total marks.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <span className="text-gray-400 block mb-0.5">Time Taken</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {timeMins}m {timeSecs}s
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <span className="text-gray-400 block mb-0.5">Attempt Status</span>
              <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                Attempt #{result.attemptNumber || 1}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Link to="/exams" className="btn-secondary text-xs px-5 py-2.5">
              Back to All Exams
            </Link>
            <Link to={`/exams/${id}/take`} className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Examination
            </Link>
          </div>
        </div>
      </div>

      {/* Detailed Question Review */}
      {result.questionsWithAnswers && result.questionsWithAnswers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Detailed Question Breakdown
          </h2>

          <div className="space-y-4">
            {result.questionsWithAnswers.map((q, qIdx) => {
              const studentAns = result.answers?.find((a) => a.question === q._id);
              const isCorrect = studentAns?.isCorrect;

              return (
                <div key={q._id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {qIdx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {q.text}
                      </h4>
                    </div>

                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {studentAns?.marksObtained || 0} / {q.marks} pts
                    </span>
                  </div>

                  {/* Options Review */}
                  {q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {q.options.map((opt, oIdx) => {
                        const isStudentPick = studentAns?.selectedOption === opt._id;
                        const isRight = opt.isCorrect;

                        let style = 'p-3 rounded-lg border text-xs font-medium flex items-center justify-between ';
                        if (isRight) {
                          style += 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                        } else if (isStudentPick && !isRight) {
                          style += 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                        } else {
                          style += 'border-gray-200 dark:border-gray-800 text-gray-500';
                        }

                        return (
                          <div key={opt._id} className={style}>
                            <span>
                              <strong className="mr-1">{String.fromCharCode(65 + oIdx)}.</strong>
                              {opt.text}
                            </span>
                            {isRight && <Check className="w-4 h-4 text-emerald-600" />}
                            {isStudentPick && !isRight && <X className="w-4 h-4 text-rose-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">
                      <strong>Explanation: </strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

