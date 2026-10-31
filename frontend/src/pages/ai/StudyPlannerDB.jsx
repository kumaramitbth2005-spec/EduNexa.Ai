import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, CheckCircle2, Clock, Target, Trash2, Edit3,
  Loader2, AlertTriangle, Brain, BookOpen, ChevronLeft, ChevronRight,
  CheckSquare, Square, Flag, X, Save, BarChart2
} from 'lucide-react';
import { plannerService, aiService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  medium: { label: 'Medium', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', dot: 'bg-red-500' },
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toInputDate = (d) => {
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
};

export default function StudyPlannerDB() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(toInputDate(today()));
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  // AI Plan generation
  const [showAIPlan, setShowAIPlan] = useState(false);
  const [aiGoals, setAiGoals] = useState('');
  const [aiHours, setAiHours] = useState(user?.availableStudyHoursPerDay || 2);
  const [aiWeeks, setAiWeeks] = useState(4);
  const [aiPlan, setAiPlan] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New task form
  const [form, setForm] = useState({
    title: '', description: '', topic: '', subject: '',
    priority: 'medium', estimatedMinutes: 30, scheduledDate: toInputDate(today()),
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeTab === 'today') params.date = toInputDate(today());
      else if (activeTab === 'date') params.date = selectedDate;
      else if (activeTab === 'pending') params.status = 'pending';
      else if (activeTab === 'done') params.status = 'done';
      const res = await plannerService.getTasks(params);
      setTasks(res.data.tasks || []);
    } catch (e) {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedDate]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await plannerService.getStats();
      setStats(res.data.stats);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await plannerService.createTask({ ...form, source: 'manual' });
      setTasks([...tasks, res.data.task].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)));
      setForm({ title: '', description: '', topic: '', subject: '', priority: 'medium', estimatedMinutes: 30, scheduledDate: toInputDate(today()) });
      setShowCreate(false);
      fetchStats();
    } catch (e) {
      setError('Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    try {
      const res = await plannerService.updateTask(task._id, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === task._id ? res.data.task : t)));
      fetchStats();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await plannerService.deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
      fetchStats();
    } catch (e) {
      setError('Failed to delete task.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setSaving(true);
    try {
      const res = await plannerService.updateTask(editingTask._id, editingTask);
      setTasks(tasks.map((t) => (t._id === editingTask._id ? res.data.task : t)));
      setEditingTask(null);
    } catch (e) {
      setError('Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  const generateAIPlan = async () => {
    if (!aiGoals.trim()) return;
    setAiLoading(true);
    setAiPlan('');
    try {
      const res = await aiService.generateStudyPlan({
        goals: aiGoals,
        availableHoursPerDay: aiHours,
        durationWeeks: aiWeeks,
        subjects: user?.skills || [],
        language: user?.preferredLanguage || 'en',
      });
      setAiPlan(res.data.plan);
    } catch (e) {
      setError('AI plan generation failed. Please check your API key configuration.');
    } finally {
      setAiLoading(false);
    }
  };

  const TABS = [
    { key: 'today', label: "Today's Tasks" },
    { key: 'date', label: 'By Date' },
    { key: 'pending', label: 'Pending' },
    { key: 'done', label: 'Completed' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-blue-600" size={26} />
            Study Planner
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Organize your study tasks and track progress</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowAIPlan(!showAIPlan); setShowCreate(false); }}
            className="flex items-center gap-2 border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Brain size={16} />
            AI Plan
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowAIPlan(false); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Today's Tasks", value: stats.todayTasks, icon: <Calendar size={16} />, color: 'text-blue-600' },
            { label: 'Total Tasks', value: stats.totalTasks, icon: <Target size={16} />, color: 'text-gray-600 dark:text-gray-300' },
            { label: 'Completed', value: stats.completedTasks, icon: <CheckCircle2 size={16} />, color: 'text-green-600' },
            { label: 'Pending', value: stats.pendingTasks, icon: <Clock size={16} />, color: 'text-orange-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className={`flex items-center gap-2 ${s.color} mb-1`}>{s.icon}<span className="text-xs">{s.label}</span></div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Plan Generator */}
      {showAIPlan && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain size={18} className="text-purple-500" />
            AI Study Plan Generator
          </h3>
          <div className="space-y-3">
            <textarea
              value={aiGoals}
              onChange={(e) => setAiGoals(e.target.value)}
              placeholder="What do you want to learn? (e.g., Master Data Structures & Algorithms for placement preparation)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hours/day available</label>
                <input type="number" value={aiHours} onChange={(e) => setAiHours(Number(e.target.value))}
                  min={0.5} max={12} step={0.5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duration (weeks)</label>
                <input type="number" value={aiWeeks} onChange={(e) => setAiWeeks(Number(e.target.value))}
                  min={1} max={52}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={generateAIPlan}
              disabled={aiLoading || !aiGoals.trim()}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Brain size={16} /> Generate Study Plan</>}
            </button>
          </div>
          {aiPlan && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700 leading-relaxed">
              {aiPlan}
            </div>
          )}
        </div>
      )}

      {/* Create Task Form */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">New Task</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title *"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Subject"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="Topic"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select
                value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} Priority</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                required
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="number" value={form.estimatedMinutes}
                  onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })}
                  min={5} max={480} step={5}
                  placeholder="Minutes"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>
            <textarea
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-max px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Picker for "By Date" tab */}
      {activeTab === 'date' && (
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="font-medium">No tasks found</p>
          <p className="text-sm mt-1">Add a task or generate an AI study plan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all ${
                task.status === 'done'
                  ? 'border-green-200 dark:border-green-800 opacity-75'
                  : 'border-gray-200 dark:border-gray-700 hover:shadow-sm'
              }`}
            >
              {editingTask?._id === task._id ? (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <input
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                      className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <input type="date" value={toInputDate(editingTask.scheduledDate)}
                      onChange={(e) => setEditingTask({ ...editingTask, scheduledDate: e.target.value })}
                      className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    />
                    <input type="number" value={editingTask.estimatedMinutes}
                      onChange={(e) => setEditingTask({ ...editingTask, estimatedMinutes: Number(e.target.value) })}
                      min={5} step={5}
                      placeholder="Minutes"
                      className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setEditingTask(null)} className="flex-1 p-1.5 text-gray-400 hover:text-gray-600 rounded border border-gray-200 dark:border-gray-600">
                        <X size={14} className="mx-auto" />
                      </button>
                      <button type="submit" disabled={saving} className="flex-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded">
                        <Save size={14} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleStatus(task)} className="mt-0.5 flex-shrink-0">
                    {task.status === 'done' ? (
                      <CheckSquare size={20} className="text-green-500" />
                    ) : (
                      <Square size={20} className="text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {task.subject && <span className="text-xs text-gray-500 dark:text-gray-400">{task.subject}</span>}
                      {task.topic && <span className="text-xs text-blue-500">• {task.topic}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[task.priority]?.color}`}>
                        {PRIORITY_CONFIG[task.priority]?.label}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} />{task.estimatedMinutes} min
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(task.scheduledDate)}</span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditingTask(task)} className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(task._id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

