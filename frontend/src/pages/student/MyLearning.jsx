import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services';
import ProgressBar from '../../components/ui/ProgressBar';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import {
  BookOpen, Play, CheckCircle2, Clock, Award, FileText,
  HelpCircle, ChevronRight, GraduationCap, ArrowRight, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyLearning() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getEnrolledCourses();
      setEnrollments(res.data.enrollments || []);
    } catch (err) {
      toast.error('Failed to load your enrolled courses.');
    } finally {
      setLoading(false);
    }
  };

  const totalEnrolled = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.isCompleted || e.progress === 100).length;
  const certificatesEarned = enrollments.filter((e) => e.certificateIssued).length;
  const totalAssignmentsSolved = enrollments.reduce(
    (sum, e) => sum + (e.assignmentsProgress?.submittedCount || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in pb-16">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Learning Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track your verified curriculum progress, progressive 22 assignments, 50-MCQ assessments, and credentials.
          </p>
        </div>
        <Link to="/courses" className="btn-primary text-xs py-2 px-4 self-start flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Explore Course Catalog
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Enrolled Courses</span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalEnrolled}
          </div>
          <span className="text-[11px] text-primary-600 font-semibold">Active curriculums</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Assignments Completed</span>
          <div className="text-2xl font-bold text-emerald-600">
            {totalAssignmentsSolved}
          </div>
          <span className="text-[11px] text-gray-400">Out of 22 per course</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Completed Courses</span>
          <div className="text-2xl font-bold text-purple-600">
            {completedCourses}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold">100% Curriculum finished</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs text-gray-500">Verified Certificates</span>
          <div className="text-2xl font-bold text-amber-500">
            {certificatesEarned}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Authenticated credentials</span>
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard type="course" count={4} />
        </div>
      ) : enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments.map((enr) => {
            const course = enr.course;
            if (!course) return null;

            const progress = enr.progress || 0;
            const completedLessons = enr.completedLessons?.length || 0;
            const assignProgress = enr.assignmentsProgress || { submittedCount: 0 };
            const assessmentStatus = enr.assessment || { attempted: false };
            const isCertEligible = progress === 100 && assignProgress.submittedCount >= 22 && assessmentStatus.passed;

            return (
              <div
                key={enr._id}
                className="card overflow-hidden flex flex-col justify-between border hover:border-primary-400 dark:hover:border-primary-700 transition-all p-5 space-y-4"
              >
                {/* Course Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                        {course.category}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1.5 line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        Instructor: {course.teacher?.name || 'Verified Faculty'} • {course.level}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-primary-600">{progress}%</span>
                      <div className="text-[10px] text-gray-400">Curriculum</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <ProgressBar value={progress} color="green" />

                  {/* 3 Pillars Tracker: Curriculum, 22 Assignments, 50-MCQ Assessment */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-center text-xs">
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                      <span className="text-[10px] text-gray-400 block">Topics</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {completedLessons} Completed
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                      <span className="text-[10px] text-gray-400 block">22 Assignments</span>
                      <span className={`font-bold ${assignProgress.submittedCount >= 22 ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                        {assignProgress.submittedCount || 0} / 22 Done
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                      <span className="text-[10px] text-gray-400 block">50-MCQ Exam</span>
                      <span className={`font-bold ${assessmentStatus.passed ? 'text-emerald-600' : assessmentStatus.attempted ? 'text-amber-500' : 'text-gray-400'}`}>
                        {assessmentStatus.passed ? `Passed (${assessmentStatus.percentage}%)` : assessmentStatus.attempted ? `${assessmentStatus.percentage}% (Retake)` : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Certificate Status Tag */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-400">Graduation Certificate:</span>
                    {enr.certificateIssued ? (
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Issued & Verified
                      </span>
                    ) : isCertEligible ? (
                      <span className="font-bold text-amber-500 flex items-center gap-1 animate-pulse">
                        <Award className="w-3.5 h-3.5" /> Ready to Claim
                      </span>
                    ) : (
                      <span className="text-gray-400">Locked (Requirements in progress)</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/courses/${course._id}/learn`)}
                    className="btn-primary flex-1 text-xs py-2 px-3 flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/20"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Continue Learning
                  </button>

                  <Link
                    to={`/courses/${course._id}/assignments`}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                  >
                    Assignments ({assignProgress.submittedCount || 0}/22)
                  </Link>

                  <Link
                    to={`/courses/${course._id}/assessment`}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 text-purple-600 dark:text-purple-400"
                  >
                    50 MCQs
                  </Link>

                  <Link
                    to={`/courses/${course._id}/certificate`}
                    className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center"
                    title="Certificate Status"
                  >
                    <Award className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No courses enrolled yet"
          description="Explore our accredited courses across all 12 academic categories, complete your registration form, and start learning!"
          actionLabel="Explore Course Catalog"
          onAction={() => navigate('/courses')}
        />
      )}
    </div>
  );
}
