import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examService } from '../../services';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import {
  BarChart2, Clock, CheckCircle2, XCircle, ArrowRight,
  TrendingUp, Award, Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

export default function ExamHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await examService.getStudentHistory();
      setResults(res.data.results || []);
    } catch (err) {
      toast.error('Failed to load past test results');
    } finally {
      setLoading(false);
    }
  };

  const chartData = results.slice().reverse().map((r, i) => ({
    name: `Test ${i + 1}`,
    score: r.percentage,
    title: r.exam?.title || 'Exam',
  }));

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary-500" />
          My Examination History & Progress
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your exam scores, pass rates, and learning growth trends over time
        </p>
      </div>

      {/* Progress Chart */}
      {results.length > 1 && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Performance Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Results Table / Cards */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard count={3} />
        </div>
      ) : results.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">Examination</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((res) => (
                  <tr key={res._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                        {res.exam?.title || 'Practice Test'}
                      </p>
                      <span className="text-xs text-gray-400 capitalize">{res.exam?.type || 'General'}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(res.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-base">
                      {res.percentage}%
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        ({res.obtainedMarks}/{res.totalMarks})
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        res.isPassed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {res.isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {res.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/exams/${res.exam?._id || res.exam}/result`}
                        className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1"
                      >
                        Breakdown <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BarChart2}
          title="No examination records"
          description="You haven't completed any exams yet. Start an exam to measure your knowledge."
          actionLabel="Browse Available Exams"
          onAction={() => (window.location.href = '/exams')}
        />
      )}
    </div>
  );
}

