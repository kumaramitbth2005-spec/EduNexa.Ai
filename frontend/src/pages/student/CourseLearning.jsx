import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService, aiService } from '../../services';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  BookOpen, CheckCircle, ChevronRight, ChevronDown, Play,
  Sparkles, ArrowLeft, ArrowRight, MessageSquare, Send,
  Code, AlertCircle, FileText, Check, Award, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseLearning() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [curriculum, setCurriculum] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [openModules, setOpenModules] = useState({});

  // AI Tutor Drawer State
  const [showAITutor, setShowAITutor] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [convId, setConvId] = useState(null);

  useEffect(() => {
    fetchCurriculum();
  }, [id]);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourseCurriculum(id);
      setCurriculum(res.data);

      // Auto-open first 3 modules
      const initialOpen = {};
      (res.data.modules || []).forEach((m, idx) => {
        if (idx < 3) initialOpen[m.moduleIndex] = true;
      });
      setOpenModules(initialOpen);

      // Pick first unfinished lesson or first lesson
      let firstLesson = null;
      for (const m of res.data.modules || []) {
        for (const t of m.topics || []) {
          if (!t.isCompleted && !firstLesson) {
            firstLesson = t._id;
          }
        }
      }
      if (!firstLesson && res.data.modules?.[0]?.topics?.[0]) {
        firstLesson = res.data.modules[0].topics[0]._id;
      }

      if (firstLesson) {
        setActiveLessonId(firstLesson);
        loadLesson(firstLesson);
      }
    } catch (err) {
      toast.error('Failed to load course curriculum.');
      navigate(`/courses/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = async (lessonId) => {
    try {
      setLessonLoading(true);
      const res = await courseService.getLessonDetails(id, lessonId);
      setLessonData(res.data);
      setActiveLessonId(lessonId);

      // Make sure its parent module is expanded
      if (res.data.lesson?.moduleIndex) {
        setOpenModules((prev) => ({ ...prev, [res.data.lesson.moduleIndex]: true }));
      }
    } catch (err) {
      toast.error('Failed to load lesson details.');
    } finally {
      setLessonLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLessonId) return;
    try {
      const res = await courseService.completeLesson(id, activeLessonId);
      toast.success('Topic completed!');

      // Update state in curriculum
      setCurriculum((prev) => {
        if (!prev) return prev;
        const newModules = prev.modules.map((m) => ({
          ...m,
          topics: m.topics.map((t) =>
            t._id === activeLessonId ? { ...t, isCompleted: true } : t
          ),
        }));
        const totalCompleted = (prev.stats?.completedTopics || 0) + 1;
        return {
          ...prev,
          modules: newModules,
          stats: {
            ...prev.stats,
            completedTopics: totalCompleted,
            progress: res.data.progress,
          },
        };
      });

      // Update active lesson status
      if (lessonData) {
        setLessonData((prev) => ({
          ...prev,
          status: { ...prev.status, isCompleted: true },
        }));
      }

      // If next lesson exists, advance
      if (lessonData?.navigation?.nextLesson?._id) {
        loadLesson(lessonData.navigation.nextLesson._id);
      }
    } catch (err) {
      toast.error('Could not mark lesson as complete.');
    }
  };

  const toggleModule = (modIdx) => {
    setOpenModules((prev) => ({ ...prev, [modIdx]: !prev[modIdx] }));
  };

  // AI Tutor Ask
  const handleAskAI = async (e) => {
    e?.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const userMsg = aiInput.trim();
    setAiInput('');
    setAiChat((prev) => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);

    try {
      const contextualPrompt = `[Context: Course "${curriculum?.course?.title}", Topic "${lessonData?.lesson?.title}"]\nStudent Question: ${userMsg}`;
      const res = await aiService.chat({
        message: contextualPrompt,
        conversationId: convId,
      });

      if (res.data.success) {
        setConvId(res.data.conversationId);
        setAiChat((prev) => [...prev, { role: 'model', content: res.data.response }]);
      }
    } catch (err) {
      setAiChat((prev) => [
        ...prev,
        { role: 'model', content: 'AI Tutor is temporarily unavailable. Please try again.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const lesson = lessonData?.lesson;
  const nav = lessonData?.navigation;
  const isLessonCompleted = lessonData?.status?.isCompleted;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] -m-4 md:-m-6 overflow-hidden">
      {/* ── Left Sidebar: 22 Module Curriculum Tree ── */}
      <div className="w-full lg:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-2">
          <Link
            to={`/courses/${id}`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Course Overview
          </Link>
          <h2 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
            {curriculum?.course?.title}
          </h2>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{curriculum?.stats?.completedTopics || 0} of {curriculum?.stats?.totalTopics || 0} topics completed</span>
              <span className="font-bold text-primary-600">{curriculum?.stats?.progress || 0}%</span>
            </div>
            <ProgressBar value={curriculum?.stats?.progress || 0} />
          </div>
        </div>

        {/* Quick Nav Buttons */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold text-center">
          <Link
            to={`/courses/${id}/assignments`}
            className="py-1.5 px-2 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            22 Tasks
          </Link>
          <Link
            to={`/courses/${id}/assessment`}
            className="py-1.5 px-2 rounded hover:bg-white dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400"
          >
            50 MCQs
          </Link>
          <Link
            to={`/courses/${id}/certificate`}
            className="py-1.5 px-2 rounded hover:bg-white dark:hover:bg-gray-700 text-amber-600 dark:text-amber-400"
          >
            Certificate
          </Link>
        </div>

        {/* Module Accordions */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {(curriculum?.modules || []).map((m) => {
            const isOpen = !!openModules[m.moduleIndex];
            const modTopics = m.topics || [];
            const completedCount = modTopics.filter((t) => t.isCompleted).length;

            return (
              <div key={m.moduleIndex} className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => toggleModule(m.moduleIndex)}
                  className="w-full p-2.5 flex items-center justify-between text-left text-xs font-semibold bg-gray-50/80 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {m.moduleIndex}
                    </span>
                    <span className="truncate text-gray-800 dark:text-gray-200">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400">
                    <span>{completedCount}/{modTopics.length}</span>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-1 space-y-0.5 bg-white dark:bg-gray-900">
                    {modTopics.map((t) => {
                      const isActive = t._id === activeLessonId;
                      return (
                        <button
                          key={t._id}
                          onClick={() => loadLesson(t._id)}
                          className={`w-full p-2 rounded-md text-left text-xs flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-950/70 text-primary-600 font-bold'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span className="truncate pr-2">{t.title}</span>
                          {t.isCompleted ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Panel: Rich Topic Learning Page ── */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50 p-4 md:p-8 space-y-6">
        {lessonLoading ? (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="skeleton h-48 w-full rounded-xl" />
            <div className="skeleton h-96 w-full rounded-xl" />
          </div>
        ) : lesson ? (
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in pb-16">
            {/* Topic Header */}
            <div className="card p-6 border-l-4 border-primary-600 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold">
                  Module {lesson.moduleIndex}: {lesson.moduleTitle}
                </span>
                <span className="text-gray-400">Est. Time: {lesson.completionTime || 20} mins</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {lesson.title}
              </h1>
              {lesson.introduction && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "{lesson.introduction}"
                </p>
              )}
            </div>

            {/* 1. Formal Definition & Easy Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5 space-y-2 border-emerald-500/20">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Academic Definition
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {lesson.definition || 'Formal operational specification governing predictable execution.'}
                </p>
              </div>

              <div className="card p-5 space-y-2 border-blue-500/20">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Intuitive / Easy Explanation
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {lesson.easyExplanation || 'A straightforward model illustrating core principles without unnecessary jargon.'}
                </p>
              </div>
            </div>

            {/* 2. Detailed Technical Explanation */}
            <div className="card p-6 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-600" />
                Detailed Technical Mechanics
              </h3>
              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {lesson.detailedExplanation || lesson.content}
              </div>

              {lesson.importantConcepts?.length > 0 && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Core Invariants & Concepts:</span>
                  <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {lesson.importantConcepts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 3. Step-by-Step Working & Syntax */}
            {lesson.syntax && (
              <div className="card p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600">Standard Syntax Specification</h3>
                <pre className="p-3 rounded-lg bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                  <code>{lesson.syntax}</code>
                </pre>
              </div>
            )}

            {/* 4. Complete Code Example with Line-by-Line Annotations */}
            {lesson.codeSnippet && (
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Practical Implementation ({lesson.codeLanguage || 'Java'})
                  </h3>
                  <div className="text-[11px] font-mono text-gray-400">
                    {lesson.timeComplexity && `Time: ${lesson.timeComplexity}`}
                  </div>
                </div>

                <pre className="p-4 rounded-xl bg-gray-950 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800">
                  <code>{lesson.codeSnippet}</code>
                </pre>

                {lesson.expectedOutput && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs">
                    <span className="font-bold text-emerald-400">Expected Terminal Output:</span>
                    <pre className="mt-1 font-mono text-emerald-200">{lesson.expectedOutput}</pre>
                  </div>
                )}

                {lesson.codeLineByLine?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Line-by-Line Code Breakdown:</h4>
                    <div className="space-y-1.5">
                      {lesson.codeLineByLine.map((item, idx) => (
                        <div key={idx} className="p-2 rounded bg-gray-50 dark:bg-gray-800/60 text-xs flex gap-3">
                          <span className="font-mono text-primary-600 font-bold shrink-0">L{item.line || idx + 1}</span>
                          <div>
                            <code className="font-mono text-gray-800 dark:text-gray-200 font-semibold">{item.code}</code>
                            <p className="text-gray-500 text-[11px] mt-0.5">{item.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Common Pitfalls & Interview Questions */}
            {lesson.interviewQuestions?.length > 0 && (
              <div className="card p-6 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  Top Technical Interview Questions
                </h3>
                <div className="space-y-3">
                  {lesson.interviewQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Q{idx + 1}: {q.question}</p>
                      <p className="text-gray-600 dark:text-gray-300 pl-4 border-l-2 border-amber-500/50">
                        Ans: {q.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion & Navigation Footer */}
            <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-xl border border-primary-500/30 backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCompleteLesson}
                  disabled={isLessonCompleted}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                    isLessonCompleted
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'btn-primary shadow-primary-500/30'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isLessonCompleted ? 'Topic Completed' : 'Mark Topic as Completed'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {nav?.prevLesson && (
                  <button
                    onClick={() => loadLesson(nav.prevLesson._id)}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                )}
                {nav?.nextLesson && (
                  <button
                    onClick={() => loadLesson(nav.nextLesson._id)}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">Select a topic from the left curriculum tree to begin.</div>
        )}
      </div>

      {/* ── Ask AI Tutor Floating Widget ── */}
      <div className="fixed bottom-6 right-6 z-40">
        {!showAITutor ? (
          <button
            onClick={() => setShowAITutor(true)}
            className="px-4 py-3 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-2xl hover:scale-105 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI Tutor on Topic
          </button>
        ) : (
          <div className="w-80 sm:w-96 h-[460px] card flex flex-col shadow-2xl border-2 border-primary-500/40 animate-fade-in bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-xs">AI Tutor: {lesson?.title?.slice(0, 24)}...</span>
              </div>
              <button
                onClick={() => setShowAITutor(false)}
                className="text-white/80 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs scrollbar-thin">
              <div className="p-2.5 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-200">
                👋 Hello! I am your AI Tutor for <strong>{lesson?.title}</strong>. Ask me to explain concepts, dry run algorithms, or prepare exam notes!
              </div>

              {aiChat.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white ml-6 text-right'
                      : 'bg-primary-50/70 dark:bg-primary-950/40 text-gray-800 dark:text-gray-200 mr-6'
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              {aiLoading && (
                <div className="text-gray-400 text-xs italic flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
                  Generating pedagogical explanation...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAskAI} className="p-2 border-t border-gray-200 dark:border-gray-800 flex gap-1.5">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask about this topic..."
                className="input text-xs py-1.5"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="btn-primary px-3 py-1.5 text-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

