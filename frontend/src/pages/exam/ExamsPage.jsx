import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examService } from '../../services';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import {
  PenSquare, Clock, Award, CheckCircle, ArrowRight,
  Filter, HelpCircle, Layers, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');

  useEffect(() => {
    fetchExams();
  }, [type]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = {};
      if (type) params.type = type;

      const res = await examService.getExams(params);
      setExams(res.data.exams || []);
    } catch (err) {
      toast.error('Failed to load examinations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <PenSquare className="w-6 h-6 text-primary-500" />
            Examinations & Assessment Suite
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Test knowledge with timed university midterms, topic mock tests, and certification exams
          </p>
        </div>

        <Link
          to="/exams/history"
          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 font-semibold"
        >
          <BarChart2 className="w-4 h-4 text-primary-500" />
          View My Test History
        </Link>
      </div>

      {/* Filter */}
      <div className="card p-3 flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 pl-2">Filter Type:</span>
        <div className="flex flex-wrap gap-2">
          {['', 'mcq', 'practice', 'mock', 'mixed'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                type === t
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t === '' ? 'All Tests' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard type="exam" count={6} />
        </div>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam._id} className="card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950 text-primary-600 border border-primary-200 dark:border-primary-900">
                    {exam.type} test
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{exam.duration} mins</span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-base mt-3 line-clamp-1">
                  {exam.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {exam.description || 'Comprehensive assessment covering key curricular competencies.'}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Marks</span>
                    <span className="font-extrabold text-gray-800 dark:text-gray-200">{exam.totalMarks} pts</span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Passing Mark</span>
                    <span className="font-extrabold text-gray-800 dark:text-gray-200">{exam.passingMarks} pts</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Link
                  to={`/exams/${exam._id}/take`}
                  className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  Start Examination
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PenSquare}
          title="No exams currently available"
          description="Check back later or browse available study courses."
        />
      )}
    </div>
  );
}

