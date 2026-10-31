import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService, examService } from '../../services';
import StatCard from '../../components/common/StatCard';
import {
  BookOpen, Users, PenSquare, Plus, ArrowRight,
  Sparkles, Layers, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const [coursesRes, examsRes] = await Promise.all([
        courseService.getTeacherCourses(),
        examService.getExams(),
      ]);
      setCourses(coursesRes.data.courses || []);
      setExams(examsRes.data.exams || []);
    } catch (err) {
      toast.error('Failed to load instructor metrics');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-primary-700 to-purple-800 text-white p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Instructor Control Center 🎓
        </h1>
        <p className="mt-2 text-primary-100 text-sm max-w-xl">
          Welcome back, {user?.name}. Manage your curriculum tracks, upload lecture materials, and create automatic grading examinations.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/teacher/courses/new"
            className="px-4 py-2 bg-white text-primary-700 hover:bg-gray-100 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Course
          </Link>
          <Link
            to="/teacher/exams/new"
            className="px-4 py-2 bg-primary-800/80 hover:bg-primary-800 text-white border border-primary-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <PenSquare className="w-4 h-4" /> Create Examination
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Courses Authored"
          value={loading ? '...' : courses.length}
          icon={BookOpen}
          color="primary"
          subtitle="Curriculum modules"
        />
        <StatCard
          title="Active Students"
          value={loading ? '...' : totalStudents}
          icon={Users}
          color="green"
          subtitle="Total enrollments"
        />
        <StatCard
          title="Examinations Created"
          value={loading ? '...' : exams.length}
          icon={PenSquare}
          color="purple"
          subtitle="Tests & assessments"
        />
      </div>

      {/* My Courses Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            My Authored Courses
          </h2>
          <Link to="/teacher/courses" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
            Manage All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 3).map((course) => (
              <div key={course._id} className="card p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    course.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{course.level}</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                  {course.title}
                </h3>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>{course.enrollmentCount || 0} students</span>
                  <Link to={`/teacher/courses/${course._id}/edit`} className="text-primary-600 font-bold hover:underline">
                    Edit Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center border-dashed border-2">
            <p className="text-sm text-gray-500">You haven't authored any courses yet.</p>
            <Link to="/teacher/courses/new" className="btn-primary text-xs mt-3 inline-block">
              Create Your First Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

