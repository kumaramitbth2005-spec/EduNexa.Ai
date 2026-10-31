import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService, assignmentService } from '../../services';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  FileText, CheckCircle, Clock, AlertTriangle, Code, Send,
  Save, Sparkles, Award, ArrowLeft, ChevronRight, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseAssignments() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, beginner, intermediate, advanced, final_project
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Submission Modal State
  const [content, setContent] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [id]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourseAssignments(id);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentModal = async (assignment) => {
    try {
      const res = await assignmentService.getAssignment(assignment._id);
      const fullAssignment = res.data.assignment;
      const sub = res.data.submission;
      setSelectedAssignment(fullAssignment);
      setContent(sub?.content || '');
      setCode(sub?.code || fullAssignment.starterCode?.java || '');
      setLanguage(sub?.language || 'java');
      setEvalResult(sub?.status === 'evaluated' ? sub : null);
    } catch (err) {
      toast.error('Failed to load assignment details.');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedAssignment) return;
    try {
      setSubmitting(true);
      await assignmentService.submitAssignment(selectedAssignment._id, {
        content,
        code,
        language,
        isDraft: true,
      });
      toast.success('Draft saved successfully.');
      fetchAssignments();
    } catch (err) {
      toast.error('Could not save draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedAssignment) return;
    if (!content.trim() && !code.trim()) {
      toast.error('Please write an answer or provide code before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      toast('Evaluating submission with EduNexa AI...', { icon: '🤖' });
      const res = await assignmentService.submitAssignment(selectedAssignment._id, {
        content,
        code,
        language,
        isDraft: false,
      });

      toast.success('Assignment evaluated by AI!');
      setEvalResult(res.data.submission);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  const assignments = data?.assignments || [];
  const summary = data?.summary || {};

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'beginner') return a.level === 'beginner';
    if (activeTab === 'intermediate') return a.level === 'intermediate';
    if (activeTab === 'advanced') return a.level === 'advanced';
    if (activeTab === 'final_project') return a.level === 'final_project';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 animate-fade-in pb-16">
      {/* Header Breadcrumb & Title */}
      <div className="space-y-2">
        <Link
          to={`/courses/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Course Overview
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              22 Mandatory Course Assignments
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Course: <span className="font-semibold text-gray-800 dark:text-gray-200">{data?.course?.title}</span> • Complete all 22 progressive assignments to qualify for verified certification.
            </p>
          </div>
          <Link
            to={`/courses/${id}/assessment`}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 self-start shadow-md shadow-primary-500/20"
          >
            Take 50-MCQ Assessment
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Total Mandatory Tasks</span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            22 Assignments
          </div>
          <span className="text-[11px] text-gray-400">Strict certification requirement</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Evaluated / Completed</span>
          <div className="text-2xl font-bold text-emerald-600">
            {summary.evaluatedCount || 0} / 22
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {Math.round(((summary.evaluatedCount || 0) / 22) * 100)}% Complete
          </span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Cumulative Marks</span>
          <div className="text-2xl font-bold text-primary-600">
            {summary.totalMarksObtained || 0} / 220
          </div>
          <span className="text-[11px] text-gray-400">Avg: {summary.evaluatedCount > 0 ? Math.round((summary.totalMarksObtained / (summary.evaluatedCount * 10)) * 100) : 0}%</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Certification Status</span>
          <div className={`text-base font-bold mt-1 ${summary.isCompleted ? 'text-emerald-600' : 'text-amber-500'}`}>
            {summary.isCompleted ? '✓ 22 Submitted' : `${22 - (summary.submittedCount || 0)} Remaining`}
          </div>
          <span className="text-[11px] text-gray-400">AI marking rubric applied</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2 overflow-x-auto scrollbar-none text-xs font-semibold">
        {[
          { id: 'all', label: `All 22 Assignments (${assignments.length})` },
          { id: 'beginner', label: '1–5: Beginner' },
          { id: 'intermediate', label: '6–17: Intermediate' },
          { id: 'advanced', label: '18–21: Advanced' },
          { id: 'final_project', label: '22: Capstone Project' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map((a) => {
          const sub = a.submission;
          const isEvaluated = sub?.status === 'evaluated';
          const isDraft = sub?.status === 'draft';

          return (
            <div
              key={a._id}
              className="card p-5 space-y-3 flex flex-col justify-between hover:border-primary-400 dark:hover:border-primary-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="w-6 h-6 rounded-md bg-primary-100 dark:bg-primary-950 text-primary-600 font-bold flex items-center justify-center text-xs">
                    #{a.assignmentNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {a.level}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                  {a.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {a.objective || a.description}
                </p>

                <div className="text-[11px] text-gray-400 font-medium">
                  Module {a.moduleIndex}: {a.moduleTitle}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <div>
                  {isEvaluated ? (
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Score: {sub.marksObtained} / {a.totalMarks}
                    </span>
                  ) : isDraft ? (
                    <span className="text-amber-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Draft Saved
                    </span>
                  ) : (
                    <span className="text-gray-400">Not Started</span>
                  )}
                </div>

                <button
                  onClick={() => openAssignmentModal(a)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  {isEvaluated ? 'View Feedback & Resubmit' : isDraft ? 'Resume Draft' : 'Open Assignment'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Submission Modal ── */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-primary-500/30 overflow-hidden bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <div>
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                  Assignment #{selectedAssignment.assignmentNumber} • {selectedAssignment.level}
                </span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {selectedAssignment.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs scrollbar-thin">
              {/* Objective & Problem Statement */}
              <div className="p-3.5 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200/50 dark:border-primary-800/40 space-y-1.5">
                <span className="font-bold text-primary-700 dark:text-primary-300">Problem Statement:</span>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedAssignment.problemStatement}
                </p>
              </div>

              {/* Instructions & Requirements */}
              {selectedAssignment.instructions?.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-gray-800 dark:text-gray-200">Instructions:</span>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-0.5">
                    {selectedAssignment.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evaluation Feedback Banner if evaluated */}
              {evalResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      EduNexa AI Evaluation Result
                    </span>
                    <span className="font-bold text-sm text-emerald-600 bg-white dark:bg-gray-900 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Marks: {evalResult.marksObtained} / {selectedAssignment.totalMarks} ({evalResult.percentage}%)
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    "{evalResult.feedback}"
                  </p>
                  {evalResult.improvements?.length > 0 && (
                    <div className="pt-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <span className="font-bold text-gray-800 dark:text-gray-200">Recommended Enhancements:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {evalResult.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Code Submission Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-primary-600" />
                    Source Code Solution:
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="input text-[11px] py-1 px-2 w-28"
                  >
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={9}
                  placeholder="// Paste or write your runnable solution here..."
                  className="w-full p-3 rounded-lg font-mono text-xs bg-gray-950 text-emerald-400 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Written Explanation Area */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 dark:text-gray-200">
                  Written Explanation / Complexity Analysis:
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  placeholder="Explain your approach, design tradeoffs, time and space complexity..."
                  className="input text-xs"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/40">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitEvaluation}
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-md shadow-primary-500/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {submitting ? 'Evaluating...' : 'Submit & Evaluate with AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
