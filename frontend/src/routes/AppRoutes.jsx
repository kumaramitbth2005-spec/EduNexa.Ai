import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import DashboardLayout from '../components/layout/DashboardLayout';

// Lazy-loaded pages
const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail'));

// Student
const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const CoursesPage = lazy(() => import('../pages/student/Courses'));
const CourseDetail = lazy(() => import('../pages/student/CourseDetail'));
const MaterialsPage = lazy(() => import('../pages/student/Materials'));
const ProfilePage = lazy(() => import('../pages/student/Profile'));
const SubjectNotes = lazy(() => import('../pages/student/SubjectNotes'));
const DsaLearning = lazy(() => import('../pages/student/DsaLearning'));

// AI
const AITutor = lazy(() => import('../pages/ai/AITutor'));
const PDFSummarizer = lazy(() => import('../pages/ai/PDFSummarizer'));
const QuestionGenerator = lazy(() => import('../pages/ai/QuestionGenerator'));
const StudyPlanner = lazy(() => import('../pages/ai/StudyPlanner'));
const DocumentUpload = lazy(() => import('../pages/ai/DocumentUpload'));
const SavedNotes = lazy(() => import('../pages/ai/SavedNotes'));
const StudyPlannerDB = lazy(() => import('../pages/ai/StudyPlannerDB'));

// Exam
const ExamsPage = lazy(() => import('../pages/exam/ExamsPage'));
const TakeExam = lazy(() => import('../pages/exam/TakeExam'));
const ExamResult = lazy(() => import('../pages/exam/ExamResult'));
const ExamHistory = lazy(() => import('../pages/exam/ExamHistory'));

// Community
const CommunityPage = lazy(() => import('../pages/community/CommunityPage'));
const PostDetail = lazy(() => import('../pages/community/PostDetail'));
const CreatePost = lazy(() => import('../pages/community/CreatePost'));

// Career
const CareerPage = lazy(() => import('../pages/career/CareerPage'));

// Teacher
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
const ManageCourses = lazy(() => import('../pages/teacher/ManageCourses'));
const CourseEditor = lazy(() => import('../pages/teacher/CourseEditor'));
const ManageExams = lazy(() => import('../pages/teacher/ManageExams'));
const ExamEditor = lazy(() => import('../pages/teacher/ExamEditor'));

// Admin
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));

// Guard components
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) {
    const redirectMap = { admin: '/admin', teacher: '/teacher', student: '/dashboard' };
    return <Navigate to={redirectMap[user.role] || '/dashboard'} replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/courses" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<CoursesPage />} />
          <Route path=":id" element={<CourseDetail />} />
        </Route>

        <Route path="/materials" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<MaterialsPage />} />
        </Route>

        <Route path="/subject-notes" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<SubjectNotes />} />
        </Route>

        <Route path="/dsa" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DsaLearning />} />
        </Route>

        <Route path="/ai" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/ai/tutor" />} />
          <Route path="tutor" element={<AITutor />} />
          <Route path="summarizer" element={<PDFSummarizer />} />
          <Route path="questions" element={<QuestionGenerator />} />
          <Route path="planner" element={<StudyPlanner />} />
          <Route path="planner-db" element={<StudyPlannerDB />} />
          <Route path="documents" element={<DocumentUpload />} />
          <Route path="notes" element={<SavedNotes />} />
        </Route>

        <Route path="/exams" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ExamsPage />} />
          <Route path="history" element={<ExamHistory />} />
        </Route>
        <Route path="/exams/:id/take" element={<ProtectedRoute><TakeExam /></ProtectedRoute>} />
        <Route path="/exams/:id/result" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ExamResult />} />
        </Route>

        <Route path="/community" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<CommunityPage />} />
          <Route path="posts/:id" element={<PostDetail />} />
          <Route path="new" element={<CreatePost />} />
        </Route>

        <Route path="/career" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<CareerPage />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<ProtectedRoute roles={['teacher', 'admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="courses/new" element={<CourseEditor />} />
          <Route path="courses/:id/edit" element={<CourseEditor />} />
          <Route path="exams" element={<ManageExams />} />
          <Route path="exams/new" element={<ExamEditor />} />
          <Route path="exams/:id/edit" element={<ExamEditor />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

