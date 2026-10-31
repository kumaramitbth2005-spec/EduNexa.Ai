import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../../services';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  BookOpen, Clock, Users, Star, CheckCircle, Play, FileText,
  HelpCircle, ChevronDown, ChevronUp, User, ArrowLeft, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourse(id);
      setCourse(res.data.course);
      setLessons(res.data.lessons || []);
      setIsEnrolled(res.data.isEnrolled);

      if (res.data.isEnrolled) {
        const progRes = await courseService.getCourseProgress(id);
        setProgress(progRes.data.progress || 0);
      }
    } catch (err) {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await courseService.enrollCourse(id);
      toast.success('Successfully enrolled in course!');
      setIsEnrolled(true);
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    if (!isEnrolled) {
      toast.error('Please enroll to save lesson progress');
      return;
    }
    try {
      const res = await courseService.completeLesson(id, lessonId);
      setProgress(res.data.progress);
      toast.success('Lesson marked as completed!');
    } catch (err) {
      toast.error('Could not update progress');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-64 w-full rounded-2xl" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-xl font-bold">Course Not Found</h2>
        <Link to="/courses" className="btn-primary mt-4 inline-block">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Back button */}
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-indigo-950 text-white p-6 md:p-10 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-500/30 text-primary-200 border border-primary-400/30">
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-white/10 backdrop-blur-sm">
              {course.level} Level
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs md:text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" />
              <span>Instructor: <strong className="text-white">{course.teacher?.name || 'Verified Educator'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{course.enrollmentCount || 0} students enrolled</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span>{course.rating ? course.rating.toFixed(1) : '4.9'} rating</span>
            </div>
          </div>

          {/* Enroll / Progress CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {isEnrolled ? (
              <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
                <ProgressBar value={progress} showLabel color="green" />
                <p className="text-xs text-emerald-300 mt-2 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  You are currently enrolled in this course
                </p>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn-primary text-base px-8 py-3 rounded-xl shadow-lg shadow-primary-500/40"
              >
                {enrolling ? 'Enrolling...' : 'Enroll in Course for Free'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Lessons & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Lessons Outline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              Curriculum & Lessons ({lessons.length})
            </h2>
          </div>

          <div className="space-y-3">
            {lessons.length > 0 ? (
              lessons.map((lesson, idx) => (
                <div
                  key={lesson._id}
                  className="card p-4 transition-all hover:border-primary-300 dark:hover:border-primary-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span className="capitalize">{lesson.type}</span>
                          <span>•</span>
                          <span>{lesson.completionTime || 10} mins</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveLesson(lesson)}
                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 text-primary-500" />
                        Learn
                      </button>
                      {isEnrolled && (
                        <button
                          onClick={() => handleCompleteLesson(lesson._id)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="Mark complete"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-6 text-center text-sm text-gray-500">
                No lessons uploaded for this course yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Course Requirements & Teacher Info */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Course Highlights</h3>
            <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Self-paced access with completion tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Interactive AI Tutor assistance on all topics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Verified certification upon full completion</span>
              </li>
            </ul>
          </div>

          {/* Teacher Profile Card */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">About the Instructor</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {course.teacher?.name?.charAt(0) || 'E'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{course.teacher?.name}</h4>
                <p className="text-xs text-gray-500">{course.teacher?.college || 'Faculty'}</p>
              </div>
            </div>
            {course.teacher?.bio && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                {course.teacher.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Viewer Modal */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-3xl p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-xs font-bold text-primary-600 uppercase">{activeLesson.type} lesson</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{activeLesson.title}</h3>
              </div>
              <button onClick={() => setActiveLesson(null)} className="btn-secondary text-xs px-3 py-1">
                Close
              </button>
            </div>

            <div className="py-6 space-y-4">
              {activeLesson.type === 'video' && activeLesson.videoUrl ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <iframe
                    src={activeLesson.videoUrl}
                    title={activeLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {activeLesson.content || 'This lesson content is being prepared by the educator.'}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => {
                  handleCompleteLesson(activeLesson._id);
                  setActiveLesson(null);
                }}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Completed & Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

