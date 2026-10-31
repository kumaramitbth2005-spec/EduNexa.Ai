import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Sparkles, Brain, BookOpen, PenSquare, Briefcase, Users,
  BarChart3, CheckCircle2, ArrowRight, Zap, MessageSquare, Star,
  Code2, Target, Award, Layers, FileText, Shield, ChevronDown
} from 'lucide-react';

/* ─── Lightweight scroll-reveal hook ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Reusable animated wrapper ─── */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useScrollReveal(0.1);
  const transforms = {
    up: 'translateY(48px)',
    left: 'translateX(-60px)',
    right: 'translateX(60px)',
    fade: 'scale(0.96)',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Features data ─── */
const features = [
  { icon: Brain,       color: 'from-violet-500 to-purple-600',  bg: 'bg-violet-50 dark:bg-violet-950/30', title: 'Bilingual AI Tutor',          desc: 'Ask doubts in English or Hindi. Get step-by-step explanations, code walkthroughs, and real-world examples instantly.' },
  { icon: Zap,         color: 'from-amber-400 to-orange-500',   bg: 'bg-amber-50 dark:bg-amber-950/30',  title: 'AI Practice & Evaluation',    desc: 'Topic-aware MCQs, coding problems, and rubric-scored written answers. Gemini AI evaluates your answers with detailed feedback.' },
  { icon: FileText,    color: 'from-sky-400 to-blue-600',       bg: 'bg-sky-50 dark:bg-sky-950/30',      title: 'PDF & Note Summarizer',       desc: 'Upload textbooks, handwritten notes, or lecture slides. Get high-yield revision summaries in seconds.' },
  { icon: PenSquare,   color: 'from-pink-500 to-rose-600',      bg: 'bg-pink-50 dark:bg-pink-950/30',    title: 'Real-Time Online Exams',      desc: 'Timed MCQ & descriptive exams with auto-grading, instant feedback, and in-depth performance analytics.' },
  { icon: Code2,       color: 'from-emerald-400 to-teal-600',   bg: 'bg-emerald-50 dark:bg-emerald-950/30', title: 'DSA Mastery Studio',       desc: '14-module DSA roadmap with Java, C++, Python & JS implementations, step-by-step dry-run tables, and progress tracking.' },
  { icon: Users,       color: 'from-indigo-400 to-blue-600',    bg: 'bg-indigo-50 dark:bg-indigo-950/30', title: 'Collaborative Community',   desc: 'Post doubts, upvote solutions, and connect with peers and mentors in real-time discussion threads.' },
  { icon: Target,      color: 'from-fuchsia-500 to-purple-700', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30', title: 'Adaptive Learning Engine', desc: 'EduNexa learns your weak areas and auto-recommends targeted practice drills to close your knowledge gaps.' },
  { icon: Briefcase,   color: 'from-cyan-400 to-sky-600',       bg: 'bg-cyan-50 dark:bg-cyan-950/30',    title: 'Career & Placement Prep',    desc: 'Structured roadmaps, mock interviews, company-specific question banks, and placement readiness tracking.' },
  { icon: BookOpen,    color: 'from-lime-400 to-green-600',     bg: 'bg-lime-50 dark:bg-lime-950/30',    title: 'Semester-Wise Notes',        desc: 'University curriculum notes organised by degree, branch, and semester with bilingual Hindi/English explanations.' },
];

/* ─── Scroll sections (image + text alternating) ─── */
const scrollSections = [
  {
    tag: 'AI-Powered Dashboard',
    heading: 'Your Smart Learning Command Centre',
    body: 'Get a personalised dashboard showing enrolled courses, practice streaks, exam results, and AI-driven next-step recommendations — all in one beautiful view.',
    bullets: ['Personalized daily study plan', 'Live performance analytics', 'AI-suggested practice topics', 'Course progress with visual tracker'],
    accent: 'from-primary-500 to-indigo-600',
    imgSide: 'right',
  },
  {
    tag: 'Practice & Evaluation',
    heading: 'Gemini AI Evaluates Every Answer You Write',
    body: 'Generate MCQs, conceptual questions, coding problems, and scenario-based challenges on any topic. EduNexa\'s backend evaluates your answers with rubric-based AI grading — never fake scores.',
    bullets: ['Single & multi-select MCQs with explanations', 'Rubric-graded written descriptive answers', 'Coding problems with 4-language starter code', 'Topic mastery matrix updated after every session'],
    accent: 'from-amber-500 to-orange-600',
    imgSide: 'left',
  },
  {
    tag: 'DSA Mastery Studio',
    heading: 'Crack Placements with Structured DSA Learning',
    body: 'Work through 14 curated DSA modules — Arrays, Trees, Graphs, Dynamic Programming and more. Each topic includes visual dry-run tables, Java/C++/Python/JS implementations, and time-complexity analysis.',
    bullets: ['14 DSA modules covering all interview patterns', 'Code in 4 languages with syntax highlighting', 'Step-by-step dry-run & complexity analysis', 'Progress tracking with study streak rewards'],
    accent: 'from-emerald-500 to-teal-600',
    imgSide: 'right',
  },
];

/* ─── Stats ─── */
const stats = [
  { value: '10,000+', label: 'Active Students', color: 'text-primary-600 dark:text-primary-400' },
  { value: '500+',    label: 'Curated Courses',  color: 'text-indigo-600 dark:text-indigo-400'  },
  { value: '98.5%',  label: 'Exam Pass Rate',   color: 'text-purple-600 dark:text-purple-400'  },
  { value: '24/7',   label: 'AI Availability',  color: 'text-pink-600 dark:text-pink-400'      },
];

/* ─── Testimonials ─── */
const testimonials = [
  { name: 'Priya Sharma',   role: 'B.Tech CSE, 3rd Year', text: 'EduNexa\'s AI Practice system helped me crack my university sem exams. The rubric feedback on written answers is like having a personal professor!', rating: 5 },
  { name: 'Arjun Mehta',    role: 'Software Engineer, Wipro', text: 'The DSA Studio and mock interviews gave me the confidence to crack my placement at Wipro. Best platform for placements prep.', rating: 5 },
  { name: 'Sneha Patel',    role: 'MCA Final Year', text: 'I uploaded my handwritten notes and the AI summarised them perfectly. The bilingual Hindi support is a game-changer for regional students.', rating: 5 },
];

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-primary-500 selection:text-white overflow-x-hidden">

      {/* ── STICKY HEADER ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrollY > 40 ? 'rgba(255,255,255,0.92)' : 'transparent',
          backdropFilter: scrollY > 40 ? 'blur(16px)' : 'none',
          borderBottom: scrollY > 40 ? '1px solid rgba(229,231,235,0.8)' : '1px solid transparent',
          boxShadow: scrollY > 40 ? '0 2px 24px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              EduNexa
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features"   className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#showcase"   className="hover:text-primary-600 transition-colors">Platform</a>
            <a href="#ai-suite"   className="hover:text-primary-600 transition-colors">AI Suite</a>
            <a href="#testimonials" className="hover:text-primary-600 transition-colors">Reviews</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login"    className="hidden sm:inline-flex btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2 shadow-lg shadow-primary-500/25 rounded-xl">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-indigo-50/50 to-purple-50/60 dark:from-gray-950 dark:via-indigo-950/20 dark:to-purple-950/10" />
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[85vh]">

            {/* LEFT — Text content */}
            <div className="text-left space-y-7 py-16">
              <div
                style={{ opacity: 1, animation: 'fadeSlideUp 0.7s ease forwards' }}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 text-xs font-semibold uppercase tracking-wider border border-primary-200 dark:border-primary-800">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  Next-Generation Smart Learning Platform
                </div>
              </div>

              <div style={{ animation: 'fadeSlideUp 0.7s ease 0.1s both' }}>
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.08]">
                  Learn Better.{' '}
                  <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Practice Smarter.
                  </span>
                  <br />
                  Build Your Future.
                </h1>
              </div>

              <div style={{ animation: 'fadeSlideUp 0.7s ease 0.2s both' }}>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                  EduNexa fuses <strong className="text-gray-900 dark:text-white">Gemini AI</strong> with modern pedagogy — master programming, ace university exams, analyse handwritten notes, and launch your career with personalised roadmaps.
                </p>
              </div>

              <div style={{ animation: 'fadeSlideUp 0.7s ease 0.3s both' }}>
                <div className="flex flex-wrap items-center gap-3">
                  {['AI Tutor', 'DSA Studio', 'Smart Practice', 'PDF Summarizer', 'Career Prep'].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 shadow-sm">
                      ✦ {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ animation: 'fadeSlideUp 0.7s ease 0.4s both' }}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-base shadow-xl shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Start Learning Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    Sign In to Dashboard
                  </Link>
                </div>
              </div>

              {/* Mini stat row */}
              <div style={{ animation: 'fadeSlideUp 0.7s ease 0.5s both' }}>
                <div className="flex items-center gap-6 pt-2">
                  {stats.slice(0, 3).map((s) => (
                    <div key={s.label}>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Dashboard screenshot with floating badges */}
            <div
              className="relative hidden lg:block"
              style={{ animation: 'fadeSlideLeft 0.9s ease 0.2s both' }}
            >
              {/* Glow behind image */}
              <div className="absolute inset-4 bg-gradient-to-br from-primary-400/30 to-purple-400/30 rounded-3xl blur-2xl" />

              {/* Main screenshot */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/20 border border-gray-200/60 dark:border-gray-700/60 ring-1 ring-white/50">
                <img
                  src="/dashboard-preview.png"
                  alt="EduNexa Dashboard Preview"
                  className="w-full h-auto object-cover"
                  style={{ transform: `translateY(${scrollY * 0.04}px)` }}
                />
                {/* Screenshot overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating badge 1 */}
              <div className="absolute -top-4 -left-6 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-float">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Session Evaluated</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">Score: 91% · Mastery Unlocked</p>
                </div>
              </div>

              {/* Floating badge 2 */}
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-float" style={{ animationDelay: '1.2s' }}>
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">AI Tutor Active</p>
                  <p className="text-[11px] text-primary-600 font-semibold">Gemini 1.5 Flash · EN / हिंदी</p>
                </div>
              </div>

              {/* Floating badge 3 */}
              <div className="absolute top-1/2 -right-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 animate-float" style={{ animationDelay: '0.6s' }}>
                <Zap className="w-5 h-5 fill-current" />
                <div>
                  <p className="text-xs font-bold">AI Practice</p>
                  <p className="text-[11px] opacity-90">5 questions ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 animate-bounce">
          <span className="text-xs font-medium">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── SCROLL SHOWCASE SECTIONS ── */}
      <div id="showcase">
        {scrollSections.map((sec, idx) => (
          <section key={idx} className={`py-24 ${idx % 2 === 0 ? 'bg-gray-50/80 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-950'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${sec.imgSide === 'left' ? '' : ''}`}>

                {/* Text — always LEFT on mobile, alternates on desktop */}
                <Reveal direction={sec.imgSide === 'right' ? 'left' : 'right'} delay={0}
                  className={sec.imgSide === 'left' ? 'lg:order-2' : 'lg:order-1'}
                >
                  <div className="space-y-6 max-w-lg">
                    <span className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-gradient-to-r ${sec.accent} text-white`}>
                      {sec.tag}
                    </span>

                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                      {sec.heading}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                      {sec.body}
                    </p>

                    <ul className="space-y-3">
                      {sec.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${sec.accent} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/register"
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${sec.accent} text-white font-semibold text-sm shadow-lg hover:-translate-y-0.5 transition-all`}
                    >
                      Try It Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Reveal>

                {/* Image */}
                <Reveal direction={sec.imgSide === 'right' ? 'right' : 'left'} delay={100}
                  className={sec.imgSide === 'left' ? 'lg:order-1' : 'lg:order-2'}
                >
                  <div className="relative group">
                    {/* Glow */}
                    <div className={`absolute inset-4 bg-gradient-to-br ${sec.accent} opacity-20 rounded-3xl blur-2xl group-hover:opacity-30 transition-all duration-700`} />

                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/60 dark:border-gray-700/60 ring-1 ring-white/40 group-hover:scale-[1.01] transition-transform duration-500">
                      <img
                        src="/dashboard-preview.png"
                        alt={`EduNexa — ${sec.tag}`}
                        className="w-full h-auto object-cover"
                        style={{ maxHeight: '380px', objectPosition: idx === 0 ? 'top' : idx === 1 ? 'center' : 'bottom' }}
                      />
                      {/* Overlay tint matching section accent */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none`} />

                      {/* Section-specific corner badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${sec.accent} text-white text-[11px] font-bold shadow-md`}>
                          <Sparkles className="w-3 h-3" />
                          {sec.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-24 bg-gray-50/60 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="up" className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Everything in One Place</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Engineered for Academic &amp; Career Excellence
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Stop juggling disconnected apps. EduNexa integrates study notes, AI tutoring, live exams, DSA prep, and career tools.
            </p>
          </Reveal>

          <div id="ai-suite" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={i} direction="up" delay={i * 60} className="h-full">
                <div className={`h-full p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 group`}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="up" className="text-center mb-16">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Simple Workflow</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Three Steps to Mastery</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: BookOpen, title: 'Enroll & Learn',    desc: 'Browse university curriculum tracks or tech skills. Access structured notes, videos, and semester content.',    color: 'from-primary-500 to-indigo-600' },
              { step: '02', icon: Brain,    title: 'Practice with AI',  desc: 'Study any topic → EduNexa auto-generates personalised MCQs, coding challenges, and rubric-scored written tasks.', color: 'from-amber-500 to-orange-500' },
              { step: '03', icon: Award,    title: 'Ace Placements',     desc: 'Track mastery metrics, crack company mock assessments, and get your personalised career roadmap.',              color: 'from-emerald-500 to-teal-600' },
            ].map((item, idx) => (
              <Reveal key={idx} direction="up" delay={idx * 120}>
                <div className="relative p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center hover:-translate-y-1 hover:shadow-lg transition-all group">
                  <span className="absolute top-4 right-5 text-6xl font-black text-gray-100 dark:text-gray-800 select-none group-hover:text-primary-100 dark:group-hover:text-primary-950 transition-colors">
                    {item.step}
                  </span>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5 shadow-xl relative z-10`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((s, i) => (
              <Reveal key={i} direction="up" delay={i * 80}>
                <div>
                  <p className="text-4xl font-extrabold">{s.value}</p>
                  <p className="text-sm text-primary-100 mt-1 font-medium">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 bg-gray-50/70 dark:bg-gray-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="up" className="text-center mb-14">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Student Stories</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Real Students. Real Results.</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Reveal key={i} direction="up" delay={i * 100}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col">
                  <div className="flex mb-3">
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1 italic">
                    "{t.text}"
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-indigo-700 to-purple-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Reveal direction="up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-semibold mb-6 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Start Your Journey Today — It's Free
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to Transform<br />Your Learning Journey?
            </h2>
            <p className="mt-5 text-lg text-primary-100 max-w-2xl mx-auto">
              Join thousands of students using EduNexa to ace university exams, crack placements, and build their future with AI.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-white text-primary-700 font-bold text-base shadow-xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
              >
                Sign Up For Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl border border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">EduNexa</span>
              <span className="text-xs text-gray-600 ml-2">© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#features"    className="hover:text-white transition-colors">Features</a>
              <a href="#showcase"    className="hover:text-white transition-colors">Platform</a>
              <Link to="/courses"    className="hover:text-white transition-colors">Courses</Link>
              <Link to="/community"  className="hover:text-white transition-colors">Community</Link>
              <Link to="/login"      className="hover:text-white transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── KEYFRAME STYLES ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
