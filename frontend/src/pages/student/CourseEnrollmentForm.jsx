import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services';
import {
  GraduationCap, User, Phone, Mail, Building, BookOpen,
  CheckCircle2, ArrowRight, ShieldCheck, Sparkles, AlertCircle, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseEnrollmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrolledResult, setEnrolledResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // A. Personal Information
    fullName: user?.name || '',
    email: user?.email || '',
    mobile: user?.phone || '',
    profilePicture: user?.avatar || '',

    // B. Academic Information
    college: user?.college || '',
    degree: user?.degree || 'Bachelor of Technology (B.Tech)',
    branch: user?.branch || 'Computer Science & Engineering',
    currentYear: '3rd Year',
    currentSemester: user?.semester ? `Semester ${user.semester}` : 'Semester 5',
    studentId: '',

    // C. Course Information
    learningLevel: 'intermediate',
    learningGoal: 'University Curriculum & Placement Preparation',
    preferredLanguage: 'en',

    // D. Declaration
    declarationConfirmed: true,
  });

  useEffect(() => {
    fetchCourseInfo();
  }, [id]);

  const fetchCourseInfo = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourse(id);
      setCourse(res.data.course);

      // If already enrolled, check enrollment details
      if (res.data.isEnrolled) {
        try {
          const enrRes = await courseService.getEnrollmentDetails(id);
          if (enrRes.data.enrollment) {
            setEnrolledResult(enrRes.data.enrollment);
          }
        } catch (_) {}
      }
    } catch (err) {
      toast.error('Failed to load course information.');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.college.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }
    if (!formData.declarationConfirmed) {
      toast.error('You must accept the academic declaration and assessment requirements.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        personalInfo: {
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          profilePicture: formData.profilePicture,
        },
        academicInfo: {
          college: formData.college,
          degree: formData.degree,
          branch: formData.branch,
          currentYear: formData.currentYear,
          currentSemester: formData.currentSemester,
          studentId: formData.studentId,
        },
        courseInfo: {
          selectedCourse: course.title,
          courseCategory: course.category,
          learningLevel: formData.learningLevel,
          learningGoal: formData.learningGoal,
          preferredLanguage: formData.preferredLanguage,
        },
        declarationConfirmed: formData.declarationConfirmed,
      };

      const res = await courseService.enrollCourse(id, payload);
      toast.success(res.data.message || 'Course enrollment confirmed!');
      setEnrolledResult(res.data.enrollment);
    } catch (err) {
      const msg = err.response?.data?.message || 'Enrollment submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Confirmation Screen
  if (enrolledResult) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in">
        <div className="card p-8 text-center space-y-6 border-2 border-emerald-500/20 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              Official Enrollment Confirmed
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              Welcome to {course?.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your academic profile and course registration have been registered in MongoDB.
            </p>
          </div>

          {/* Enrollment ID Banner */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wider">Unique Enrollment ID</span>
              <span className="font-mono text-emerald-600 font-bold">{enrolledResult.enrollmentId || 'ENX-ENR-2026-VERIFIED'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-gray-400">Student:</span>{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{enrolledResult.personalInfo?.fullName || user?.name}</span>
              </div>
              <div>
                <span className="text-gray-400">Campus:</span>{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{enrolledResult.academicInfo?.college || 'Engineering Institute'}</span>
              </div>
              <div>
                <span className="text-gray-400">Assignments:</span>{' '}
                <span className="font-semibold text-primary-600">22 Progressive Tasks</span>
              </div>
              <div>
                <span className="text-gray-400">Assessment:</span>{' '}
                <span className="font-semibold text-purple-600">50 MCQs (70% Pass)</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(`/courses/${id}/learn`)}
              className="btn-primary flex-1 py-3 text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
            >
              Start Learning Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/my-learning"
              className="btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-2"
            >
              Go to My Learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <Link
        to={`/courses/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Course Overview
      </Link>

      {/* Header Banner */}
      <div className="card p-6 bg-gradient-to-r from-primary-900/10 via-primary-600/5 to-purple-600/10 border-primary-200 dark:border-primary-900/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400">
              Course Enrollment Form
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              Official Course Registration
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
              Complete your verification details to enroll in <span className="font-semibold text-gray-800 dark:text-gray-200">{course?.title}</span> and unlock your curriculum, 22 assignments, 50-MCQ assessment, and verified certificate.
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-primary-600 text-white items-center justify-center shadow-lg shadow-primary-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION A: Personal Information */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            <User className="w-4 h-4 text-primary-600" />
            <span>A. Personal Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="e.g. Aarav Patel"
                className="input mt-1 text-sm"
              />
              <span className="text-[10px] text-gray-400">This exact name will be printed on your verified certificate.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="student@university.edu"
                className="input mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="input mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Profile Avatar URL (Optional)
              </label>
              <input
                type="text"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleChange}
                placeholder="https://..."
                className="input mt-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: Academic Information */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>B. Academic Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                College / University Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                required
                placeholder="e.g. National Institute of Technology / IIT Delhi"
                className="input mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Degree</label>
              <select name="degree" value={formData.degree} onChange={handleChange} className="input mt-1 text-sm">
                <option value="Bachelor of Technology (B.Tech)">Bachelor of Technology (B.Tech)</option>
                <option value="Bachelor of Engineering (B.E.)">Bachelor of Engineering (B.E.)</option>
                <option value="Bachelor of Computer Applications (BCA)">Bachelor of Computer Applications (BCA)</option>
                <option value="Master of Computer Applications (MCA)">Master of Computer Applications (MCA)</option>
                <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                <option value="Other Technical Degree">Other Technical Degree</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Branch / Department</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="Computer Science & Engineering"
                className="input mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Current Year</label>
              <select name="currentYear" value={formData.currentYear} onChange={handleChange} className="input mt-1 text-sm">
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduated">Graduated / Working Professional</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Current Semester</label>
              <select name="currentSemester" value={formData.currentSemester} onChange={handleChange} className="input mt-1 text-sm">
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 4">Semester 4</option>
                <option value="Semester 5">Semester 5</option>
                <option value="Semester 6">Semester 6</option>
                <option value="Semester 7">Semester 7</option>
                <option value="Semester 8">Semester 8</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Student ID / University Roll Number (Optional)
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g. 21BCSE104"
                className="input mt-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: Course Preferences */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>C. Course Learning Preferences</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Course Selected</label>
              <input
                type="text"
                value={course?.title || ''}
                readOnly
                className="input mt-1 text-sm bg-gray-50 dark:bg-gray-800/80 font-semibold text-primary-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Category</label>
              <input
                type="text"
                value={course?.category || 'programming'}
                readOnly
                className="input mt-1 text-sm bg-gray-50 dark:bg-gray-800/80 capitalize"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Current Knowledge Level</label>
              <select name="learningLevel" value={formData.learningLevel} onChange={handleChange} className="input mt-1 text-sm">
                <option value="beginner">Beginner (Foundational)</option>
                <option value="intermediate">Intermediate (Conceptual)</option>
                <option value="advanced">Advanced (Deep Systems & DSA)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Preferred AI Tutor Language</label>
              <select name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} className="input mt-1 text-sm">
                <option value="en">English</option>
                <option value="hi">Hindi (Devanagari)</option>
                <option value="en-hi">Hinglish (Bilingual)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Primary Learning Goal</label>
              <input
                type="text"
                name="learningGoal"
                value={formData.learningGoal}
                onChange={handleChange}
                placeholder="e.g. Master algorithms, score high in exams, crack software engineer interview"
                className="input mt-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION D: Declaration */}
        <div className="card p-6 space-y-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>D. Academic Honor Code & Declaration</span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="declarationConfirmed"
              checked={formData.declarationConfirmed}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              I solemnly affirm that the personal and academic information provided above is true and authentic. I agree to abide by EduNexa's academic standards, solve all 22 progressive assignments independently, and complete the mandatory 50-question comprehensive assessment ($\ge 70\%$) to earn my official verified credential.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3.5 text-base rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary-500/30"
        >
          {submitting ? (
            'Processing Official Enrollment...'
          ) : (
            <>
              Confirm & Submit Course Enrollment
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
