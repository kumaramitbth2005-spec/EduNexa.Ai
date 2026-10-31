import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, materialService } from '../../services';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  BookOpen, Clock, Users, Star, CheckCircle, Play, FileText,
  HelpCircle, ChevronDown, ChevronUp, User, ArrowLeft, Lock,
  Sparkles, RefreshCw, AlertTriangle, Layers, Award, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('curriculum'); // curriculum, syllabus, notes, practice

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await courseService.getCourse(id);
      setCourse(res.data.course);
      setLessons(res.data.lessons || []);
      setIsEnrolled(res.data.isEnrolled);

      if (res.data.isEnrolled) {
        try {
          const progRes = await courseService.getCourseProgress(id);
          setProgress(progRes.data.progress || 0);
        } catch (_) {}
      }

      // Fetch related materials for this course/subject
      try {
        const matRes = await materialService.getMaterials({ course: id });
        setMaterials(matRes.data.materials || []);
      } catch (_) {}
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load course details. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    navigate(`/courses/${id}/enroll`);
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

  if (error) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Unable to Load Course</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={fetchCourseDetails}
            className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link to="/courses" className="btn-secondary text-sm px-5 py-2.5">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mx-auto flex items-center justify-center">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">The requested course could not be located in the curriculum catalog.</p>
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
              <div className="w-full max-w-lg bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span className="font-semibold">Course Progress</span>
                  <span className="font-bold text-emerald-300">{progress}% Completed</span>
                </div>
                <ProgressBar value={progress} color="green" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/courses/${id}/learn`)}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-md shadow-primary-500/30"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Continue Learning
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${id}/assignments`)}
                    className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm transition-all"
                  >
                    22 Assignments
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${id}/assessment`)}
                    className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm transition-all"
                  >
                    50-MCQ Exam
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${id}/certificate`)}
                    className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Certificate
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                className="btn-primary text-base px-8 py-3 rounded-xl shadow-lg shadow-primary-500/40 flex items-center gap-2"
              >
                Enroll in Course (Official Form)
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2 md:gap-6 overflow-x-auto scrollbar-none">
        {[
          { id: 'curriculum', label: `Curriculum & Lessons (${lessons.length})`, icon: BookOpen },
          { id: 'syllabus', label: 'Syllabus & Objectives', icon: Layers },
          { id: 'notes', label: `Study Resources (${materials.length})`, icon: FileText },
          { id: 'practice', label: 'Practice & Quizzes', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Lessons & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tab Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* TAB 1: Curriculum */}
          {activeTab === 'curriculum' && (
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
                <div className="card p-8 text-center text-sm text-gray-500 space-y-2">
                  <BookOpen className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Lessons being prepared</p>
                  <p className="text-xs">The instructor is finalizing the interactive lesson modules for this curriculum.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Syllabus & Learning Objectives */}
          {activeTab === 'syllabus' && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">Learning Outcomes</h3>
                {course.outcomes && course.outcomes.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {course.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">Comprehensive foundation in {course.title}, standard university examination prep, and hands-on problem solving.</p>
                )}
              </div>

              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">Prerequisites</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((req, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {course.semester && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <Layers className="w-5 h-5 text-primary-500" />
                  <div className="text-xs">
                    <span className="font-semibold text-gray-900 dark:text-white">University Semester: </span>
                    <span className="text-gray-600 dark:text-gray-400">Semester {course.semester}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Notes & Resources */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {materials.length > 0 ? (
                materials.map((mat) => (
                  <div key={mat._id} className="card p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-primary-500" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{mat.title}</h4>
                        <p className="text-xs text-gray-500 uppercase">{mat.type} • {mat.fileName || 'Resource file'}</p>
                      </div>
                    </div>
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  </div>
                ))
              ) : (
                <div className="card p-8 text-center text-sm text-gray-500 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">No external notes uploaded yet</p>
                  <p className="text-xs">You can upload handwritten notes or generate instant revision notes with EduNexa AI.</p>
                  <Link to="/ai/documents" className="btn-secondary text-xs inline-block mt-2">
                    Upload Handwritten Notes
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Practice & Quizzes */}
          {activeTab === 'practice' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">AI-Powered Practice & Concept Checks</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Generate exam-standard questions specifically tailored for {course.title}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to={`/ai/questions?topic=${encodeURIComponent(course.title)}`}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Generate Practice Questions
                </Link>
                <Link
                  to="/exams"
                  className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Browse Examinations
                </Link>
              </div>
            </div>
          )}
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

