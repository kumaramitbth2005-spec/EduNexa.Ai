import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, FileText, Brain, PenSquare, Users, Briefcase,
  GraduationCap, Settings, LogOut, X, ChevronRight, Zap, Star, Trophy,
  MessageSquare, BarChart3, UserCheck, Shield, Terminal, Layers
} from 'lucide-react';

const studentNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-learning', icon: Award, label: 'My Learning' },
  { to: '/courses', icon: BookOpen, label: 'Explore Courses' },
  { to: '/subject-notes', icon: FileText, label: 'Subject Notes' },
  { to: '/dsa', icon: Terminal, label: 'DSA Studio' },
  { to: '/practice', icon: Zap, label: 'AI Practice' },
  { to: '/materials', icon: Layers, label: 'Study Materials' },
  { to: '/exams', icon: PenSquare, label: 'Examinations' },
  { to: '/ai/tutor', icon: Brain, label: 'AI Tutor' },
  { to: '/ai/documents', icon: FileText, label: 'Handwritten Notes' },
  { to: '/ai/notes', icon: Star, label: 'Saved Notes' },
  { to: '/ai/planner-db', icon: BarChart3, label: 'Study Planner' },
  { to: '/ai/questions', icon: Trophy, label: 'Question Gen' },
  { to: '/community', icon: MessageSquare, label: 'Community' },
  { to: '/career', icon: Briefcase, label: 'Career Prep' },
];

const teacherNav = [
  { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/teacher/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/teacher/exams', icon: PenSquare, label: 'Exams' },
  { to: '/courses', icon: GraduationCap, label: 'Browse Courses' },
  { to: '/community', icon: MessageSquare, label: 'Community' },
  { to: '/dashboard/profile', icon: UserCheck, label: 'Profile' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/teacher/courses', icon: BookOpen, label: 'Courses' },
  { to: '/teacher/exams', icon: PenSquare, label: 'Exams' },
  { to: '/community', icon: MessageSquare, label: 'Community' },
];

export default function Sidebar({ onClose }) {
  const { user, logout, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();
  const navItems = isAdmin ? adminNav : isTeacher ? teacherNav : studentNav;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            EduNexa
          </span>
        </div>
        <button onClick={onClose} className="p-1 lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User info */}
      <div
        className="p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => navigate('/dashboard/profile')}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* Role badge */}
      {(isAdmin || isTeacher) && (
        <div className="px-4 py-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            isAdmin ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
          }`}>
            {isAdmin ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
            {isAdmin ? 'Administrator' : 'Teacher'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
        <NavLink to="/dashboard/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </NavLink>
        <button onClick={logout} className="sidebar-link w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}

