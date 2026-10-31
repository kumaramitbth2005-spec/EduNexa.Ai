import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { aiService, notesService } from '../../services';
import {
  HelpCircle, Sparkles, CheckCircle2, XCircle, Download,
  RefreshCw, Check, ArrowRight, AlertCircle, Bookmark, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuestionGenerator() {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [aiConfigError, setAiConfigError] = useState(null);

  useEffect(() => {
    const urlTopic = searchParams.get('topic');
    if (urlTopic) setTopic(urlTopic);
  }, [searchParams]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Please enter a study topic or chapter name');
      return;
    }

    try {
      setLoading(true);
      setAiConfigError(null);
      setShowAnswers(false);
      setQuizSubmitted(false);
      setUserAnswers({});

      const res = await aiService.generateQuestions({
        topic,
        type,
        difficulty,
        count: Number(count),
        language,
      });

      setQuestions(res.data.questions || []);
      toast.success(`Generated ${res.data.questions?.length || 0} practice questions!`);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to generate questions';
      if (err.response?.status === 503 || err.response?.data?.code === 'AI_NOT_CONFIGURED') {
        setAiConfigError('Google Gemini AI is not configured in backend/.env. Please configure GEMINI_API_KEY.');
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    questions.forEach((q, qIdx) => {
      const selectedOptIdx = userAnswers[qIdx];
      if (selectedOptIdx !== undefined && q.options && q.options[selectedOptIdx]?.isCorrect) {
        correctCount += 1;
      }
    });
    setScore(correctCount);
    setQuizSubmitted(true);
    setShowAnswers(true);
    toast.success(`Quiz completed! You scored ${correctCount}/${questions.length}`);
  };

  const handleSaveToNotes = async () => {
    try {
      const content = questions.map((q, i) => {
        const opts = (q.options || []).map((o, oi) => `  ${String.fromCharCode(65 + oi)}. ${o.text}${o.isCorrect ? ' (✓ Correct)' : ''}`).join('\n');
        return `### Q${i + 1}: ${q.text}\n${opts}\n\n**Answer:** ${q.correctAnswer || ''}\n**Explanation:** ${q.explanation || ''}\n`;
      }).join('\n---\n\n');

      await notesService.createNote({
        title: `Quiz: ${topic} (${difficulty})`,
        content,
        subject: topic,
        tags: ['Practice Quiz', difficulty, type],
        source: 'manual',
      });
      toast.success('Question set saved to Saved Notes!');
    } catch {
      toast.error('Failed to save to Notes');
    }
  };

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${topic.replace(/\s+/g, '_')}_questions.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary-500" />
          AI Practice Question & Quiz Generator
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate realistic multiple-choice questions, descriptive prompts, and concept checks for any topic
        </p>
      </div>

      {/* AI Config Banner if missing */}
      {aiConfigError && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-sm">AI Service Configuration Required</p>
            <p className="text-gray-600 dark:text-gray-400">
              {aiConfigError}
            </p>
            <p className="text-[11px] text-gray-500 pt-1">
              You can obtain a 100% free Gemini API Key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-bold text-primary-600 dark:text-primary-400">Google AI Studio</a> and paste it into <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">backend/.env</code> as <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">GEMINI_API_KEY=your_key</code>.
            </p>
          </div>
        </div>
      )}

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="card p-6 space-y-4">
        <div>
          <label className="label">Topic or Chapter Name</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Operating Systems Paging & Segmentation, Binary Search Trees, Machine Learning Loss Functions"
            className="input text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Question Format</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input text-sm"
            >
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="short">Short Answer (Conceptual)</option>
              <option value="long">Long Answer / Essay</option>
              <option value="true-false">True / False</option>
            </select>
          </div>

          <div>
            <label className="label">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="input text-sm"
            >
              <option value="easy">Easy (Fundamentals)</option>
              <option value="medium">Medium (Standard Exam)</option>
              <option value="hard">Hard (GATE / Interview)</option>
            </select>
          </div>

          <div>
            <label className="label">Number of Questions</label>
            <input
              type="number"
              min={1}
              max={15}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="input text-sm"
            />
          </div>

          <div>
            <label className="label">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating Custom Quiz with Gemini AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Practice Questions
            </>
          )}
        </button>
      </form>

      {/* Generated Questions View */}
      {questions.length > 0 && (
        <div className="space-y-6">
          {/* Score Card if Quiz Submitted */}
          {quizSubmitted && (
            <div className="card p-6 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-950/40 dark:to-indigo-950/40 border border-primary-200 dark:border-primary-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Quiz Performance: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {score / questions.length >= 0.8
                      ? '🎉 Outstanding! Strong concept mastery.'
                      : score / questions.length >= 0.5
                      ? '👍 Good job! Review the explanations below to strengthen weak points.'
                      : '📖 Recommended: Review this topic in Subject Notes and re-attempt.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuizSubmitted(false);
                  setUserAnswers({});
                  setShowAnswers(false);
                }}
                className="btn-secondary text-xs px-4 py-2"
              >
                Re-take Quiz
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Generated Questions ({questions.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {type === 'mcq' && !quizSubmitted && (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Grade & Submit Quiz
                </button>
              )}
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                {showAnswers ? 'Hide Answers' : 'Reveal All Answers'}
              </button>
              <button
                onClick={handleSaveToNotes}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-primary-600 dark:text-primary-400"
                title="Save into Saved Notes"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save to Notes
              </button>
              <button
                onClick={downloadJSON}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                      {q.text}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {q.difficulty || difficulty}
                  </span>
                </div>

                {/* Options if MCQ */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[qIdx] === optIdx;
                      let optionClasses = 'p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ';

                      if (showAnswers) {
                        if (opt.isCorrect) {
                          optionClasses += 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                        } else if (isSelected && !opt.isCorrect) {
                          optionClasses += 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200';
                        } else {
                          optionClasses += 'border-gray-200 dark:border-gray-800 text-gray-500';
                        }
                      } else {
                        if (isSelected) {
                          optionClasses += 'bg-primary-50 dark:bg-primary-950/50 border-primary-500 text-primary-700 dark:text-primary-300';
                        } else {
                          optionClasses += 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={optionClasses}
                        >
                          <span className="font-bold mr-2 text-primary-600">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation or Descriptive Answer */}
                {(showAnswers || q.type !== 'mcq') && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                    {q.correctAnswer && (
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Answer: {q.correctAnswer}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-700 dark:text-gray-300">Explanation: </strong>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

