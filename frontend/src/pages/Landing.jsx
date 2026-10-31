import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Sparkles, Brain, BookOpen,
  Users, ArrowRight, Zap, Star, Code2, Target, Award,
  FileText, CheckCircle2, BarChart2, MessageSquare,
  Lightbulb, Shield, ChevronDown, Check
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────── */
const TOTAL_FRAMES = 300;
const FOLDER       = '/ezgif-1c596d5b01f79a61-jpg';
const pad          = (n) => String(n).padStart(3, '0');
const frameUrl     = (n) => `${FOLDER}/ezgif-frame-${pad(n)}.jpg`;

/* ─── Fixed Background Canvas (Scroll-Scrubbed across entire page) ─── */
function FixedScrollCanvas() {
  const canvasRef   = useRef(null);
  const imgsRef     = useRef([]);
  const curFrameRef = useRef(0);
  const rafRef      = useRef(null);

  const drawFrame = useCallback((idx) => {
    const c = canvasRef.current;
    if (!c) return;

    let img = imgsRef.current[idx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Find nearest loaded frame
      const total = imgsRef.current.length;
      for (let offset = 1; offset < 40; offset++) {
        const left = idx - offset;
        const right = idx + offset;
        if (left >= 0 && imgsRef.current[left]?.complete) {
          img = imgsRef.current[left];
          break;
        }
        if (right < total && imgsRef.current[right]?.complete) {
          img = imgsRef.current[right];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) {
      img = imgsRef.current[0];
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = c.getContext('2d');
    const cw = c.width, ch = c.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  // Preload frames
  useEffect(() => {
    const imgs = new Array(TOTAL_FRAMES).fill(null);
    imgsRef.current = imgs;

    // Load frame 1 immediately
    const f1 = new Image();
    f1.onload = () => {
      imgs[0] = f1;
      drawFrame(0);
    };
    f1.src = frameUrl(1);

    // Load remaining frames in background
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.onload = () => {
        imgs[i - 1] = img;
        if (curFrameRef.current === i - 1) drawFrame(i - 1);
      };
      img.src = frameUrl(i);
      imgs[i - 1] = img;
    }
  }, [drawFrame]);

  // Handle window resize
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
      drawFrame(curFrameRef.current);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawFrame]);

  // Handle global page scroll -> map scroll percentage directly to frame
  useEffect(() => {
    const onScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;

      const scrolled = window.scrollY;
      const progress = Math.min(1, Math.max(0, scrolled / totalScroll));
      const targetFrame = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));

      if (targetFrame !== curFrameRef.current) {
        curFrameRef.current = targetFrame;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(targetFrame));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [drawFrame]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-gray-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
      {/* Sleek dark overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950/90" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════════ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const features = [
    { icon: Brain,         title: 'AI Tutor',           color: 'bg-purple-500/20 text-purple-400', desc: 'Instant step-by-step explanations for any academic question, available 24/7.' },
    { icon: FileText,      title: 'PDF Summarizer',     color: 'bg-blue-500/20 text-blue-400',     desc: 'Upload any textbook or notes PDF and get a crisp AI summary in seconds.' },
    { icon: Zap,           title: 'Question Generator', color: 'bg-cyan-500/20 text-cyan-400',     desc: 'Auto-generate MCQs, conceptual, written and coding questions for any topic.' },
    { icon: Code2,         title: 'DSA Learning',       color: 'bg-green-500/20 text-green-400',   desc: 'Visual DSA explanations and AI-guided practice from arrays to dynamic programming.' },
    { icon: Target,        title: 'AI Practice System', color: 'bg-orange-500/20 text-orange-400', desc: 'Adaptive practice sessions that automatically tailor to your weak areas.' },
    { icon: BookOpen,      title: 'Subject Notes',      color: 'bg-pink-500/20 text-pink-400',     desc: 'Organized subject-wise notes with smart search and instant AI insights.' },
    { icon: BarChart2,     title: 'Progress Analytics', color: 'bg-yellow-500/20 text-yellow-400', desc: 'Detailed performance analytics, study streaks, and topic mastery tracking.' },
    { icon: MessageSquare, title: 'Smart Quizzes',      color: 'bg-red-500/20 text-red-400',       desc: 'Topic-aware quizzes with instant feedback, explanations, and grading.' },
    { icon: Lightbulb,     title: 'Study Planner',      color: 'bg-indigo-500/20 text-indigo-400', desc: 'AI study schedules that adapt to your goals, pace, and upcoming exams.' },
  ];

  const highlights = [
    {
      badge: '24/7 AI Tutor',
      badgeColor: 'border-purple-400/40 bg-purple-500/20 text-purple-200',
      title: 'Ask Anything. Learn Instantly.',
      desc: 'Never get stuck on difficult homework or concepts again. The EduNexa AI Tutor provides clear, patient, step-by-step explanations with code examples, formulas, and diagrams.',
      points: ['Instant doubt resolution in English & Hindi', 'Step-by-step mathematical derivations', 'Complete code breakdowns with time/space complexity']
    },
    {
      badge: 'Smart Adaptive Practice',
      badgeColor: 'border-cyan-400/40 bg-cyan-500/20 text-cyan-200',
      title: 'Targeted Practice That Adapts to You.',
      desc: 'No more one-size-fits-all quizzes. EduNexa diagnoses your mistakes and serves personalized practice questions in MCQs, coding, and conceptual formats.',
      points: ['AI generates questions directly from what you study', 'Detailed feedback on every wrong answer', 'Mastery ratings that evolve with every session']
    },
    {
      badge: 'DSA & Code Studio',
      badgeColor: 'border-green-400/40 bg-green-500/20 text-green-200',
      title: 'Master Data Structures & Algorithms.',
      desc: 'From Arrays and Linked Lists to Dynamic Programming and Graphs. Visual explanations, interactive test cases, and interview-level problem sets.',
      points: ['Curated problem sheets (Striver, NeetCode style)', 'Interactive code workspace with hints', 'Complexity analysis and optimal solution walkthroughs']
    }
  ];

  const stats = [
    { value: '50K+',  label: 'Active Students',      icon: Users,    color: 'bg-purple-500/20 text-purple-400' },
    { value: '200+',  label: 'Courses & Subjects',   icon: BookOpen, color: 'bg-blue-500/20 text-blue-400'     },
    { value: '1M+',   label: 'Questions Generated',  icon: Zap,      color: 'bg-cyan-500/20 text-cyan-400'     },
    { value: '98%',   label: 'Student Satisfaction', icon: Star,     color: 'bg-yellow-500/20 text-yellow-400' },
  ];

  const testimonials = [
    { name: 'Arjun Sharma',  role: 'B.Tech CSE, IIT Delhi',     avatar: 'A', text: "EduNexa's AI tutor helped me crack my semester exams. The personalized practice questions are spot-on and DSA section is incredibly detailed." },
    { name: 'Priya Patel',   role: 'MCA Student, CDAC',         avatar: 'P', text: 'I love how the platform generates practice questions based on exactly what I studied. The progress analytics keep me motivated every day.' },
    { name: 'Rahul Verma',   role: 'BCA, Amity University',     avatar: 'R', text: 'The PDF summarizer saved me hours during exam prep. I uploaded my entire textbook and got a perfect summary in under a minute!' },
    { name: 'Sneha Gupta',   role: 'B.Sc CS, Delhi University',  avatar: 'S', text: 'Finally a platform that understands Indian curriculum. The subject notes and quiz system is exactly what I needed.' },
    { name: 'Vikram Singh',  role: 'M.Tech, NIT Trichy',        avatar: 'V', text: 'The AI practice system adapts to my weak areas. My problem-solving speed improved dramatically in just 3 weeks.' },
    { name: 'Ananya Mehta',  role: 'B.Tech IT, VIT Vellore',    avatar: 'A', text: 'EduNexa is the only platform where I feel like I have a personal mentor. The AI explains things my professors never could.' },
  ];

  return (
    <div className="relative min-h-screen bg-gray-950 text-white selection:bg-purple-500 selection:text-white">

      {/* ── Fixed Scroll-Scrubbed Canvas Background ── */}
      <FixedScrollCanvas />

      {/* ── Fixed Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/85 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3.5' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold">
            <span className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
              <GraduationCap size={20} className="text-white" />
            </span>
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">EduNexa</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#highlights" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 font-medium">Login</Link>
            <Link to="/register" className="text-sm bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:scale-105">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Relative Content Container (Zero Gaps, Continuous Scroll) ── */}
      <div className="relative z-10">

        {/* ══════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════ */}
        <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-28 pb-20">
          <div className="max-w-4xl flex flex-col items-center gap-6">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-200 text-xs sm:text-sm backdrop-blur-md shadow-lg">
              <Sparkles size={14} className="text-purple-300 animate-pulse" />
              <span>India's #1 AI-Powered Smart Education Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight drop-shadow-2xl">
              Study Smarter with{' '}
              <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>

            <p className="text-gray-200 text-base sm:text-xl max-w-2xl leading-relaxed drop-shadow-md">
              Personalized AI tutoring, adaptive practice sessions, DSA problem solving, and intelligent progress tracking — built specifically for your academic syllabus.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link
                to="/register"
                className="group flex items-center gap-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-base shadow-2xl shadow-purple-500/40 transition-all hover:scale-105"
              >
                Start Learning Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 border border-white/30 hover:border-white/60 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl font-bold text-base transition-all hover:bg-white/20"
              >
                Sign In
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-8 w-full max-w-2xl">
              {[['50,000+','Learners'],['200+','Subjects'],['1M+','Questions'],['100%','Free Forever']].map(([v, l]) => (
                <div key={l} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">{v}</div>
                  <div className="text-gray-300 text-xs mt-1 font-medium">{l}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-1 text-white/70 text-xs mt-6 animate-bounce">
              <span>Scroll down to experience interactive features</span>
              <ChevronDown size={18} />
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════
            HIGHLIGHT CARDS (Alternating Showcase)
        ══════════════════════════════════════════ */}
        <section id="highlights" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/40 bg-blue-500/20 text-blue-200 text-xs font-semibold mb-4 backdrop-blur-md">
              <Zap size={13} /> Deep Learning Engine
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Engineered to Guarantee Academic Growth</h2>
            <p className="text-gray-300 max-w-xl mx-auto text-base">Watch the background canvas transition smoothly as you explore our core capabilities.</p>
          </div>

          <div className="flex flex-col gap-10">
            {highlights.map((h, i) => (
              <div
                key={h.title}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 p-8 sm:p-12 rounded-3xl bg-gray-950/70 backdrop-blur-xl border border-white/15 shadow-2xl hover:border-purple-500/40 transition-all duration-300`}
              >
                <div className="flex-1 flex flex-col gap-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold w-fit ${h.badgeColor}`}>
                    {h.badge}
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">{h.title}</h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{h.desc}</p>
                  <ul className="flex flex-col gap-2.5 mt-2">
                    {h.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-3 text-sm text-gray-200 font-medium">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/40">
                          <Check size={12} />
                        </span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full flex justify-center">
                  <div className="w-full max-w-md p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                      </div>
                      <span className="text-xs text-gray-400 font-mono">edunexa-ai.live</span>
                    </div>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
                        ⚡ AI Model: active (gemini-3.5-flash)
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200">
                        🎯 Adaptive Difficulty: Calibrated (Accuracy: 92%)
                      </div>
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200">
                        ✓ Next Topic Recommended: Dynamic Programming
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            STATS BAR
        ══════════════════════════════════════════ */}
        <section className="py-16 px-6 border-y border-white/10 bg-gray-950/60 backdrop-blur-md">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center text-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className={`p-3 rounded-xl ${s.color}`}><Icon size={24} /></span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">{s.value}</span>
                  <span className="text-gray-300 text-xs sm:text-sm font-medium">{s.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FEATURES GRID (9 Complete Tools)
        ══════════════════════════════════════════ */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/20 text-purple-200 text-xs font-semibold mb-4 backdrop-blur-md">
              <Sparkles size={13} /> Everything In One Place
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Complete Student Intelligence Toolkit</h2>
            <p className="text-gray-300 max-w-xl mx-auto text-base">Replace 10 different fragmented websites with one unified smart platform.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-7 rounded-3xl bg-gray-950/70 backdrop-blur-xl border border-white/15 hover:border-purple-500/40 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <span className={`inline-flex p-3 rounded-2xl mb-5 ${f.color}`}><Icon size={24} /></span>
                    <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                    <span>Available Free</span>
                    <span className="text-purple-400 font-semibold flex items-center gap-1">Explore →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════ */}
        <section id="how-it-works" className="py-24 px-6 border-y border-white/10 bg-gray-950/60 backdrop-blur-md">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/20 text-cyan-200 text-xs font-semibold mb-4">
                <Target size={13} /> Step-by-Step
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">How EduNexa Works</h2>
              <p className="text-gray-300 max-w-md mx-auto text-base">Get onboarded and start practicing in less than 2 minutes.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { num: '01', title: 'Create Free Account', desc: 'Sign up with your college, degree, and semester. EduNexa automatically configures your syllabus.' },
                { num: '02', title: 'Learn & Ask Doubts',  desc: 'Read curated subject notes, upload textbook PDFs for instant AI summaries, and practice DSA topics.' },
                { num: '03', title: 'Practice & Excel',     desc: 'Take adaptive practice sessions. The AI pinpoints your weak spots so you score higher in exams.' },
              ].map((s) => (
                <div key={s.num} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white font-black text-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                    {s.num}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════ */}
        <section id="testimonials" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/20 text-yellow-200 text-xs font-semibold mb-4">
              <Star size={13} className="fill-yellow-400" /> Student Feedback
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Loved by 50,000+ Students</h2>
            <p className="text-gray-300 max-w-md mx-auto text-base">Real experiences from students who transformed their exam prep with EduNexa.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-8 rounded-3xl bg-gray-950/70 backdrop-blur-xl border border-white/15 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed mb-6">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TRUST BAR
        ══════════════════════════════════════════ */}
        <section className="py-14 px-6 border-y border-white/10 bg-gray-950/60 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-12 text-gray-300 text-sm font-medium">
            {[
              { icon: Shield,       label: 'Bank-Grade Privacy & Security' },
              { icon: Zap,          label: 'Powered by Google Gemini AI'   },
              { icon: Users,        label: '50,000+ Active Students'       },
              { icon: Star,         label: '4.9 / 5 Overall Rating'        },
              { icon: CheckCircle2, label: '100% Free to Get Started'      },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 hover:text-white transition-colors">
                <Icon size={18} className="text-purple-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FINAL CALL TO ACTION
        ══════════════════════════════════════════ */}
        <section className="py-28 px-6 text-center">
          <div className="max-w-3xl mx-auto p-10 sm:p-14 rounded-3xl bg-gray-950/80 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/40 bg-purple-500/20 text-purple-200 text-xs font-semibold">
              <GraduationCap size={15} /> Join the EduNexa Community
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Ready to Upgrade<br />
              <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Your Academic Performance?
              </span>
            </h2>
            <p className="text-gray-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Join thousands of students who are achieving top marks and mastering complex concepts with EduNexa. No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link
                to="/register"
                className="group flex items-center gap-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-base shadow-2xl shadow-purple-500/40 transition-all hover:scale-105"
              >
                Create Free Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="border border-white/30 hover:border-white/60 bg-white/10 text-white px-10 py-4 rounded-xl font-bold text-base transition-all hover:bg-white/20"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════ */}
        <footer className="border-t border-white/10 bg-gray-950/90 backdrop-blur-xl py-12 px-6">
          <div className="max-w-7xl mx-auto grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                  <GraduationCap size={18} className="text-white" />
                </span>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">EduNexa</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Empowering students with AI-driven personalized study plans, step-by-step doubt clearing, and adaptive test generation.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {['AI Tutor','AI Practice','DSA Learning','PDF Summarizer','Study Planner'].map((l) => (
                  <li key={l}>
                    <Link to="/register" className="hover:text-white transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {[['Login','/login'],['Register','/register'],['Dashboard','/dashboard']].map(([l, h]) => (
                  <li key={l}>
                    <Link to={h} className="hover:text-white transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>© 2026 EduNexa. All rights reserved.</p>
            <p className="flex items-center gap-1">Made with <span className="text-red-500">♥</span> for Indian students</p>
          </div>
        </footer>

      </div>

      <style>{`
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #6b21a8; border-radius: 10px; }
      `}</style>

    </div>
  );
}
