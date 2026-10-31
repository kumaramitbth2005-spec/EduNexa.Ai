import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Sparkles, Brain, BookOpen, PenSquare, Briefcase, Users,
  BarChart3, CheckCircle2, ArrowRight, ShieldCheck, Zap, Globe, MessageSquare, Star
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              EduNexa
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How It Works</a>
            <a href="#ai-suite" className="hover:text-primary-600 transition-colors">AI Suite</a>
            <a href="#career" className="hover:text-primary-600 transition-colors">Career Prep</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2 shadow-md shadow-primary-500/25">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-white dark:from-gray-900/40 dark:via-gray-950 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 text-xs font-semibold uppercase tracking-wider mb-6 border border-primary-200 dark:border-primary-800">
            <Sparkles className="w-4 h-4 text-primary-500" />
            The Next-Generation Smart Learning Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Learn Better. Practice Smarter.{' '}
            <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Build Your Future.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            EduNexa connects artificial intelligence with modern pedagogy. Master programming, ace university exams,
            summarize complex research, and launch your career with tailored roadmaps.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto btn-primary px-8 py-3.5 text-base flex items-center justify-center gap-2 shadow-xl shadow-primary-500/30 rounded-xl"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/courses"
              className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-base rounded-xl"
            >
              Explore Courses
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-gray-200 dark:border-gray-800">
            <div>
              <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">10,000+</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">500+</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Curated Courses</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">98.5%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Exam Pass Rate</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-pink-600 dark:text-pink-400">24/7</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI Tutor Availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50/70 dark:bg-gray-900/40 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
              Everything in One Place
            </h2>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              Engineered for Academic and Career Excellence
            </p>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Stop juggling disjointed apps. EduNexa integrates study materials, exams, live discussions, and AI guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-6 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center mb-5">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bilingual AI Tutor</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Ask doubts in English or Hindi. Receive step-by-step breakdowns, real-world examples, and code explanations.
              </p>
            </div>

            <div className="card p-6 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI PDF Summarizer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Upload lengthy textbooks, lecture notes, or research papers and generate high-yield revision summaries in seconds.
              </p>
            </div>

            <div className="card p-6 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-5">
                <PenSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Real-time Online Exams</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Take timed MCQ and descriptive exams with auto-grading, instant feedback, and deep performance analytics.
              </p>
            </div>

            <div className="card p-6 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Semester-Wise Materials</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Curated lecture notes, previous year question papers, lab manuals, and syllabus files organized by semester.
              </p>
            </div>

            <div className="card p-6 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-5">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Placement & DSA Prep</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Structured Data Structures & Algorithms roadmaps, company interview questions, and placement readiness tracking.
              </p>
            </div>

            <div className="card p-6 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Collaborative Community</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Connect with peers, create discussion threads, upvote solutions, and get answers from verified mentors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-primary-600 uppercase tracking-widest">Simple Workflow</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Three Steps to Mastery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg shadow-primary-500/25">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Enroll in Courses</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick university curriculum tracks or tech skills like Full-Stack, AI/ML, and DSA.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg shadow-indigo-500/25">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Practice with AI</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test understanding with automatic question generation, voice Q&A, and PDF summarization.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg shadow-purple-500/25">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Ace Placements</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track readiness metrics, crack company mock assessments, and land your dream job.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Transform Your Learning Journey?
          </h2>
          <p className="mt-4 text-primary-100 text-lg max-w-2xl mx-auto">
            Join EduNexa today. Access modern courses, AI tutors, and mock tests designed for your success.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-primary-600 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition-colors"
            >
              Sign Up For Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-white">EduNexa</span>
            <span className="text-xs text-gray-500 ml-2">© {new Date().getFullYear()} EduNexa. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
            <Link to="/community" className="hover:text-white transition-colors">Community</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

