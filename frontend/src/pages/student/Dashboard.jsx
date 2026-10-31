import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import StatCard from '../../components/common/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import SkeletonCard from '../../components/common/SkeletonCard';
import {
  BookOpen, CheckCircle, Flame, Award, Brain, PenSquare,
  FileText, ArrowRight, PlayCircle, Trophy, Sparkles, Zap, Target
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await userService.getDashboardStats();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl shadow-primary-500/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduNexa Smart Assistant Ready</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="mt-2 text-primary-100 text-sm md:text-base leading-relaxed">
            Ready to continue your journey? You have an ongoing study streak of{' '}
            <span className="font-bold text-white underline decoration-amber-400 decoration-2">
              {data?.stats?.studyStreak || user?.studyStreak || 0} days
            </span>
            . Keep up the momentum!
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/practice"
              className="px-4 py-2 bg-white text-primary-600 hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              AI Practice & Mastery
            </Link>
            <Link
              to="/ai/tutor"
              className="px-4 py-2 bg-primary-700/80 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all border border-primary-500/30"
            >
              <Brain className="w-4 h-4" />
              Ask AI Tutor
            </Link>
            <Link
              to="/courses"
              className="px-4 py-2 bg-primary-700/80 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all border border-primary-500/30"
            >
              <BookOpen className="w-4 h-4" />
              Explore Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Enrolled Courses"
          value={loading ? '...' : data?.stats?.totalEnrolled || 0}
          icon={BookOpen}
          color="primary"
          subtitle="Courses in progress"
        />
        <StatCard
          title="Completed Courses"
          value={loading ? '...' : data?.stats?.completed || 0}
          icon={CheckCircle}
          color="green"
          subtitle="Certificates earned"
        />
        <StatCard
          title="Study Streak"
          value={loading ? '...' : `${data?.stats?.studyStreak || 0} Days`}
          icon={Flame}
          color="amber"
          subtitle="Daily active study"
        />
        <StatCard
          title="Reward Points"
          value={loading ? '...' : data?.stats?.totalPoints || 0}
          icon={Award}
          color="purple"
          subtitle="Academic achievements"
        />
      </div>

      {/* Main Content Grid: In-Progress Courses & Recent Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Enrolled Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              Recent Courses
            </h2>
            <Link to="/courses" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard type="course" count={2} />
            </div>
          ) : data?.recentCourses?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.recentCourses.map((enrollment) => (
                <div key={enrollment._id} className="card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden relative mb-3">
                      {enrollment.course?.thumbnail ? (
                        <img
                          src={enrollment.course.thumbnail}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-primary-600">
                          <BookOpen className="w-10 h-10 opacity-60" />
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-sm">
                        {enrollment.course?.category || 'Curriculum'}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">
                      {enrollment.course?.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <ProgressBar value={enrollment.progress || 0} showLabel color="primary" />
                    <Link
                      to={`/courses/${enrollment.course?._id}`}
                      className="btn-secondary w-full mt-3 py-1.5 text-xs flex items-center justify-center gap-1 font-semibold"
                    >
                      <PlayCircle className="w-4 h-4 text-primary-500" />
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center border-dashed border-2">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No courses enrolled yet</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-4">
                Explore our catalog of university and tech courses to begin learning.
              </p>
              <Link to="/courses" className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1">
                Browse Courses <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column (1 span): Quick Actions & Recent Exam Scores */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Link
                to="/practice"
                className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors text-center"
              >
                <Zap className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">AI Practice</span>
              </Link>
              <Link
                to="/ai/tutor"
                className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 hover:bg-primary-100 transition-colors text-center"
              >
                <Brain className="w-6 h-6 text-primary-600 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">AI Tutor</span>
              </Link>
              <Link
                to="/exams"
                className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-100 transition-colors text-center"
              >
                <PenSquare className="w-6 h-6 text-purple-600 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Mock Exam</span>
              </Link>
              <Link
                to="/subject-notes"
                className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 transition-colors text-center"
              >
                <FileText className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Notes</span>
              </Link>
              <Link
                to="/materials"
                className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors text-center"
              >
                <BookOpen className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Materials</span>
              </Link>
              <Link
                to="/career"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 transition-colors text-center"
              >
                <Trophy className="w-6 h-6 text-rose-600 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Career Prep</span>
              </Link>
            </div>
          </div>

          {/* Recent Exam Results */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <PenSquare className="w-4 h-4 text-purple-500" />
                Recent Results
              </h3>
              <Link to="/exams/history" className="text-xs text-primary-600 hover:underline">
                History
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="skeleton h-12 rounded" />
                <div className="skeleton h-12 rounded" />
              </div>
            ) : data?.recentResults?.length > 0 ? (
              <div className="space-y-3">
                {data.recentResults.map((res) => (
                  <div key={res._id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                        {res.exam?.title || 'Practice Test'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(res.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        res.isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {res.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No exam records yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

