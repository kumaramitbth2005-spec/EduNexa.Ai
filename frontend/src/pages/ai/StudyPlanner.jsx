import React, { useState } from 'react';
import { aiService } from '../../services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Calendar, Sparkles, Clock, Target, CheckCircle2,
  Copy, Check, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudyPlanner() {
  const [goals, setGoals] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [subjects, setSubjects] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!goals.trim()) {
      toast.error('Please describe your target learning goal or exam');
      return;
    }

    try {
      setLoading(true);
      const res = await aiService.generateStudyPlan({
        goals,
        availableHoursPerDay: Number(hoursPerDay),
        durationWeeks: Number(durationWeeks),
        subjects: subjects ? subjects.split(',').map((s) => s.trim()).filter(Boolean) : [],
        language,
      });

      setPlan(res.data.plan);
      toast.success('Your personalized roadmap is ready!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate study schedule');
    } finally {
      setLoading(false);
    }
  };

  const copyPlan = () => {
    navigator.clipboard.writeText(plan);
    setCopied(true);
    toast.success('Roadmap copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-500" />
          AI Study Planner & Roadmap Architect
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Synthesize your available study hours into actionable weekly milestones and daily routines
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerate} className="card p-6 space-y-4">
        <div>
          <label className="label">Target Objective or Examination</label>
          <input
            type="text"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="e.g. Master Full-Stack Development and build 3 production portfolio apps"
            className="input text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Study Time Per Day</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={16}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="input text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                Hours / Day
              </span>
            </div>
          </div>

          <div>
            <label className="label">Target Duration</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                className="input text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                Weeks
              </span>
            </div>
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

        <div>
          <label className="label">Target Subjects / Modules (comma-separated)</label>
          <input
            type="text"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            placeholder="e.g. Data Structures, React, Node.js, System Design"
            className="input text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating Custom Milestone Schedule...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Structured Study Plan
            </>
          )}
        </button>
      </form>

      {/* Plan Render */}
      {plan && (
        <div className="card p-6 space-y-4 border border-primary-200 dark:border-primary-900 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Your Custom Learning Schedule
            </h3>
            <button
              onClick={copyPlan}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              Copy Roadmap
            </button>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed p-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {plan}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

