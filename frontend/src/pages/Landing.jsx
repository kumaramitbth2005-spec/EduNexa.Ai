import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Sparkles, Brain, BookOpen,
  Users, ArrowRight, Zap, Star, Code2, Target, Award,
  FileText, CheckCircle2, BarChart2, MessageSquare,
  Lightbulb, Shield, Play, ChevronDown
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────── */
const TOTAL_FRAMES = 300;
const FOLDER       = '/ezgif-1c596d5b01f79a61-jpg';
const pad          = (n) => String(n).padStart(3, '0');
const frameUrl     = (n) => `${FOLDER}/ezgif-frame-${pad(n)}.jpg`;

/* ─── Scroll-reveal (for sections BELOW the scrubber) ── */
function useReveal(thresh = 0.15) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: thresh }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [thresh]);
  return [ref, vis];
}

function Reveal({ children, delay = 0, dir = 'up', className = '' }) {
  const [ref, vis] = useReveal();
  const t = { up: 'translateY(60px)', left: 'translateX(-70px)', right: 'translateX(70px)', fade: 'scale(0.92)', zoom: 'scale(0.85)' };
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : (t[dir] || t.up),
      transition: `opacity .8s cubic-bezier(.4,0,.2,1) ${delay}ms, transform .8s cubic-bezier(.4,0,.2,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SCROLL-SCRUBBED CANVAS SECTION
   — The page is tall (frames * scroll-per-frame px).
   — A sticky canvas stays fixed; scroll pos → frame idx.
══════════════════════════════════════════════════════ */
function ScrollCanvas({ children }) {
  const wrapRef   = useRef(null);   // tall outer div
  const canvasRef = useRef(null);   // fixed canvas
  const imgsRef   = useRef([]);     // preloaded Image objects
  const curFrameRef = useRef(0);
  const rafRef    = useRef(null);
  const [loaded, setLoaded]     = useState(false);
  const [progress, setProgress] = useState(0); // 0-1 scroll progress

  /* ── Preload all 300 frames ── */
  useEffect(() => {
    const imgs = new Array(TOTAL_FRAMES).fill(null);
    imgsRef.current = imgs;
    let done = 0;
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        done++;
        if (done === TOTAL_FRAMES) setLoaded(true);
      };
      img.src = frameUrl(i);
      imgs[i - 1] = img;
    }
  }, []);

  /* ── Draw a specific frame ── */
  const drawFrame = useCallback((idx) => {
    const c = canvasRef.current;
    if (!c) return;
    const img = imgsRef.current[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const ctx = c.getContext('2d');
    /* fill cover */
    const cw = c.width, ch = c.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  /* ── Scroll handler: map scroll → frame ── */
  useEffect(() => {
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect  = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const prog = Math.min(1, Math.max(0, scrolled / total));
      setProgress(prog);

      const target = Math.floor(prog * (TOTAL_FRAMES - 1));
      if (target !== curFrameRef.current) {
        curFrameRef.current = target;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(target));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [drawFrame]);

  /* ── Resize canvas to window ── */
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

  /* Draw frame 0 once loaded */
  useEffect(() => { if (loaded) drawFrame(0); }, [loaded, drawFrame]);

  return (
    /* Tall wrapper — height controls how "slow" the scrub feels */
    <div ref={wrapRef} style={{ height: `${TOTAL_FRAMES * 4}px` }} className="relative">

      {/* Sticky viewport — stays fixed while user scrolls */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Full-page canvas background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'auto' }}
        />

        {/* Dark gradient overlay so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 pointer-events-none" />

        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-20 gap-4">
            <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300 text-sm">Loading EduNexa experience…</p>
          </div>
        )}

        {/* Content overlay — children receive progress prop via context or clone */}
        <div className="relative z-10 h-full">
          {typeof children === 'function' ? children(progress) : children}
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-none"
               style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Overlay text panels (fade in/out at certain scroll points) ─── */
function OverlayPanel({ progress, from, to, children, align = 'center' }) {
  const visible = progress >= from && progress <= to;
  const mid     = (from + to) / 2;
  const dist    = progress < mid ? (progress - from) / (mid - from) : (to - progress) / (to - mid);
  const opacity = Math.min(1, Math.max(0, dist * 2));
  const ty      = progress < mid ? (1 - opacity) * 50 : (1 - opacity) * -30;

  const alignCls = align === 'left'   ? 'items-start text-left pl-12 md:pl-24'
                 : align === 'right'  ? 'items-end text-right pr-12 md:pr-24'
                 :                       'items-center text-center px-6';

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-center ${alignCls} pointer-events-none`}
      style={{ opacity, transform: `translateY(${ty}px)`, transition: 'none' }}
    >
      {children}
    </div>
  );
}

/* ─── Feature Card (for the section below the scroll) ─── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <Reveal delay={delay} dir="up">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
        <span className={`inline-flex p-3 rounded-xl mb-4 ${color}`}><Icon size={22} /></span>
        <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

function StatCard({ value, label, icon: Icon, color, delay }) {
  return (
    <Reveal delay={delay} dir="up">
      <div className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
        <span className={`p-3 rounded-xl ${color}`}><Icon size={22} /></span>
        <span className="text-3xl font-extrabold text-white">{value}</span>
        <span className="text-gray-400 text-sm text-center">{label}</span>
      </div>
    </Reveal>
  );
}

function StepCard({ num, title, desc, delay }) {
  return (
    <Reveal delay={delay} dir="up">
      <div className="flex flex-col items-center text-center p-7 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-purple-500/30">{num}</div>
        <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

function TestiCard({ name, role, text, avatar, delay }) {
  return (
    <Reveal delay={delay} dir="zoom">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
        <div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}</div>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">"{text}"</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">{avatar}</div>
          <div>
            <div className="text-white text-sm font-semibold">{name}</div>
            <div className="text-gray-500 text-xs">{role}</div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const features = [
    { icon: Brain,         title: 'AI Tutor',           color: 'bg-purple-500/20 text-purple-400', desc: 'Instant step-by-step explanations for any academic question, available 24/7.' },
    { icon: FileText,      title: 'PDF Summarizer',     color: 'bg-blue-500/20 text-blue-400',     desc: 'Upload any textbook PDF and get a crisp AI summary in seconds.' },
    { icon: Zap,           title: 'Question Generator', color: 'bg-cyan-500/20 text-cyan-400',     desc: 'Auto-generate MCQs, conceptual, written and coding questions for any topic.' },
    { icon: Code2,         title: 'DSA Learning',       color: 'bg-green-500/20 text-green-400',   desc: 'Visual DSA explanations and AI-guided practice from arrays to DP.' },
    { icon: Target,        title: 'AI Practice',        color: 'bg-orange-500/20 text-orange-400', desc: 'Adaptive practice sessions that improve based on your performance data.' },
    { icon: BookOpen,      title: 'Subject Notes',      color: 'bg-pink-500/20 text-pink-400',     desc: 'Organized subject-wise notes with smart search and AI insights.' },
    { icon: BarChart2,     title: 'Progress Analytics', color: 'bg-yellow-500/20 text-yellow-400', desc: 'Detailed performance analytics, streaks, and topic mastery tracking.' },
    { icon: MessageSquare, title: 'Smart Quizzes',      color: 'bg-red-500/20 text-red-400',       desc: 'Topic-aware quizzes with instant feedback and detailed explanations.' },
    { icon: Lightbulb,     title: 'Study Planner',      color: 'bg-indigo-500/20 text-indigo-400', desc: 'AI study schedules that adapt to your goals, pace, and exam dates.' },
  ];

  const stats = [
    { value: '50K+',  label: 'Active Students',      icon: Users,    color: 'bg-purple-500/20 text-purple-400', delay: 0   },
    { value: '200+',  label: 'Courses & Subjects',   icon: BookOpen, color: 'bg-blue-500/20 text-blue-400',     delay: 80  },
    { value: '1M+',   label: 'Questions Generated',  icon: Zap,      color: 'bg-cyan-500/20 text-cyan-400',     delay: 160 },
    { value: '98%',   label: 'Student Satisfaction', icon: Star,     color: 'bg-yellow-500/20 text-yellow-400', delay: 240 },
  ];

  const testimonials = [
    { name: 'Arjun Sharma',  role: 'B.Tech CSE, IIT Delhi',    avatar: 'A', delay: 0,   text: "EduNexa's AI tutor helped me crack my semester exams. The personalized practice questions are spot-on and DSA section is incredibly detailed." },
    { name: 'Priya Patel',   role: 'MCA Student, CDAC',        avatar: 'P', delay: 80,  text: 'I love how the platform generates practice questions based on exactly what I studied. The progress analytics keep me motivated every day.' },
    { name: 'Rahul Verma',   role: 'BCA, Amity University',    avatar: 'R', delay: 160, text: 'The PDF summarizer saved me hours during exam prep. I uploaded my entire textbook and got a perfect summary in under a minute!' },
    { name: 'Sneha Gupta',   role: 'B.Sc CS, Delhi University', avatar: 'S', delay: 240, text: 'Finally a platform that understands Indian curriculum. The subject notes and quiz system is exactly what I needed.' },
    { name: 'Vikram Singh',  role: 'M.Tech, NIT Trichy',       avatar: 'V', delay: 320, text: 'The AI practice system adapts to my weak areas. My problem-solving speed improved dramatically in just 3 weeks.' },
    { name: 'Ananya Mehta',  role: 'B.Tech IT, VIT Vellore',   avatar: 'A', delay: 400, text: 'EduNexa is the only platform where I feel like I have a personal mentor. The AI explains things my professors never could.' },
  ];

  return (
    <div className="bg-gray-950 text-white overflow-x-hidden">

      {/* ── Fixed Navbar ──────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/10 shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <GraduationCap size={20} className="text-white" />
            </span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">EduNexa</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-gray-400">
            <a href="#features"     className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">Login</Link>
            <Link to="/register" className="text-sm bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          SCROLL-SCRUBBED FULL-PAGE BACKGROUND SECTION
          300 frames × 4px = 1200px of scroll depth
      ══════════════════════════════════════════════ */}
      <ScrollCanvas>
        {(progress) => (
          <>
            {/* ── Panel 0 (0%–18%): Hero ── */}
            <OverlayPanel progress={progress} from={0} to={0.18} align="center">
              <div className="flex flex-col items-center gap-5 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-200 text-sm backdrop-blur-sm">
                  <Sparkles size={14} /> India's #1 AI-Powered Study Platform
                </div>
                <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-tight drop-shadow-2xl">
                  Study Smarter with{' '}
                  <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    AI Intelligence
                  </span>
                </h1>
                <p className="text-gray-200 text-lg max-w-xl text-center leading-relaxed drop-shadow-lg">
                  Personalized AI tutoring, adaptive practice, DSA mastery, and deep progress
                  analytics — all in one platform built for Indian students.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pointer-events-auto mt-2">
                  <Link to="/register" className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-2xl shadow-purple-500/40 transition-all hover:scale-105">
                    Start Learning Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/login" className="flex items-center gap-2 border border-white/30 hover:border-white/60 bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-white/20">
                    Sign In
                  </Link>
                </div>
                {/* Scroll hint */}
                <div className="flex flex-col items-center gap-1 text-white/60 text-xs mt-4 animate-bounce">
                  <span>Scroll to explore</span>
                  <ChevronDown size={16} />
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 1 (18%–36%): AI Tutor ── */}
            <OverlayPanel progress={progress} from={0.18} to={0.36} align="left">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-200 text-xs mb-4 backdrop-blur-sm">
                  <Brain size={12} /> AI Tutor
                </div>
                <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight drop-shadow-2xl">
                  Ask Anything.<br />
                  <span className="text-purple-300">Learn Instantly.</span>
                </h2>
                <p className="text-gray-200 text-base leading-relaxed drop-shadow-lg mb-6">
                  Your personal AI tutor is available 24/7. Get clear, step-by-step explanations
                  for any concept — from basic algebra to advanced algorithms — adapted to your level.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Mathematics', 'Physics', 'Data Structures', 'Chemistry', 'Programming'].map(t => (
                    <span key={t} className="px-3 py-1 rounded-full bg-white/20 border border-white/20 text-white text-xs backdrop-blur-sm">{t}</span>
                  ))}
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 2 (36%–54%): Practice System ── */}
            <OverlayPanel progress={progress} from={0.36} to={0.54} align="right">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 text-xs mb-4 backdrop-blur-sm">
                  <Target size={12} /> AI Practice
                </div>
                <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight drop-shadow-2xl">
                  Personalized<br />
                  <span className="text-cyan-300">Practice Sessions.</span>
                </h2>
                <p className="text-gray-200 text-base leading-relaxed drop-shadow-lg mb-6">
                  Stop studying blindly. EduNexa generates topic-specific MCQs, coding problems,
                  and descriptive questions based on exactly what you just studied — and tracks every attempt.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[['MCQ Practice','✓'],['Coding Problems','✓'],['Written Answers','✓'],['Adaptive Difficulty','✓']].map(([l, c]) => (
                    <div key={l} className="flex items-center gap-2 text-white text-sm">
                      <span className="text-green-400 font-bold">{c}</span> {l}
                    </div>
                  ))}
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 3 (54%–72%): Progress & Analytics ── */}
            <OverlayPanel progress={progress} from={0.54} to={0.72} align="left">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/40 bg-yellow-500/20 text-yellow-200 text-xs mb-4 backdrop-blur-sm">
                  <BarChart2 size={12} /> Analytics
                </div>
                <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight drop-shadow-2xl">
                  Know Where<br />
                  <span className="text-yellow-300">You Stand.</span>
                </h2>
                <p className="text-gray-200 text-base leading-relaxed drop-shadow-lg mb-6">
                  Detailed progress dashboards show your strengths, weaknesses, streaks, and topic
                  mastery — so you always know what to study next for maximum improvement.
                </p>
                <div className="flex gap-4">
                  {[['91%', 'Avg Score'], ['47', 'Topics Mastered'], ['21', 'Day Streak']].map(([v, l]) => (
                    <div key={l} className="text-center">
                      <div className="text-2xl font-black text-yellow-300">{v}</div>
                      <div className="text-white/70 text-xs">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 4 (72%–90%): DSA Learning ── */}
            <OverlayPanel progress={progress} from={0.72} to={0.90} align="right">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-400/40 bg-green-500/20 text-green-200 text-xs mb-4 backdrop-blur-sm">
                  <Code2 size={12} /> DSA Learning
                </div>
                <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight drop-shadow-2xl">
                  Master DSA<br />
                  <span className="text-green-300">Like Never Before.</span>
                </h2>
                <p className="text-gray-200 text-base leading-relaxed drop-shadow-lg mb-6">
                  Visual DSA explanations, problem walkthroughs, and AI-guided practice. From arrays
                  to dynamic programming — EduNexa makes the hardest topics click.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Arrays', 'Trees', 'Graphs', 'DP', 'Sorting', 'Recursion'].map(t => (
                    <span key={t} className="px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-200 text-xs">{t}</span>
                  ))}
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 5 (90%–100%): CTA ── */}
            <OverlayPanel progress={progress} from={0.90} to={1.0} align="center">
              <div className="flex flex-col items-center gap-5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white text-sm backdrop-blur-sm">
                  <GraduationCap size={14} /> Join 50,000+ Students
                </div>
                <h2 className="text-4xl sm:text-5xl font-black leading-tight text-center drop-shadow-2xl">
                  Ready to Transform<br />
                  <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    Your Studies?
                  </span>
                </h2>
                <p className="text-gray-200 text-center leading-relaxed">
                  Start free today. No credit card required.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pointer-events-auto">
                  <Link to="/register" className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-2xl shadow-purple-500/40 transition-all hover:scale-105">
                    Create Free Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/login" className="border border-white/30 hover:border-white/60 bg-white/10 text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-white/20 backdrop-blur-sm">
                    Sign In
                  </Link>
                </div>
              </div>
            </OverlayPanel>

            {/* ── Bottom stats bar (always visible) ── */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">
              <div className="flex flex-wrap gap-6 sm:gap-10 px-8 py-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10">
                {[['50K+','Students'],['200+','Subjects'],['1M+','Questions'],['Free','Forever']].map(([v,l]) => (
                  <div key={l} className="flex flex-col items-center">
                    <span className="text-lg font-black bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">{v}</span>
                    <span className="text-gray-400 text-xs">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </ScrollCanvas>

      {/* ══════════════════════════════════════════════
          STATIC SECTIONS BELOW THE SCROLL ZONE
      ══════════════════════════════════════════════ */}

      {/* ─ Stats ─ */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ─ Features ─ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-4">
                <Sparkles size={13} /> Everything You Need
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Powerful Features for Every Student</h2>
              <p className="text-gray-400 max-w-xl mx-auto">From AI-powered tutoring to adaptive practice — every tool accelerates your learning.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 55} />)}
          </div>
        </div>
      </section>

      {/* ─ How It Works ─ */}
      <section id="how-it-works" className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm mb-4">
                <Target size={13} /> Simple Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">How EduNexa Works</h2>
              <p className="text-gray-400">Get started in minutes. No prior setup required.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Create Your Account',   desc: 'Sign up free and set up your profile with subjects, syllabus, and learning goals.' },
              { num: '2', title: 'Study With AI Support', desc: 'Read notes, ask the AI tutor, watch DSA topics, and upload PDFs for instant summaries.' },
              { num: '3', title: 'Practice & Improve',    desc: 'Take AI-generated practice sessions, review mistakes, and watch mastery grow every day.' },
            ].map((s, i) => <StepCard key={i} {...s} delay={i * 120} />)}
          </div>
        </div>
      </section>

      {/* ─ Testimonials ─ */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm mb-4">
                <Star size={13} className="fill-yellow-400" /> Student Reviews
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Loved by 50,000+ Students</h2>
              <p className="text-gray-400 max-w-md mx-auto">Here's what students across India are saying.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => <TestiCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ─ Trust Bar ─ */}
      <section className="py-14 border-y border-white/5 bg-white/[0.02]">
        <Reveal dir="up">
          <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
            {[
              { icon: Shield,       label: 'Secure & Private'    },
              { icon: Zap,          label: 'Powered by Gemini AI' },
              { icon: Users,        label: '50,000+ Students'     },
              { icon: Star,         label: '4.9 / 5 Rating'       },
              { icon: CheckCircle2, label: '100% Free to Start'   },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <Icon size={16} className="text-purple-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─ Final CTA ─ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[5%]   w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[5%] w-[400px] h-[400px] bg-blue-600/20   rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal dir="zoom">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-6">
              <GraduationCap size={14} /> Join the Movement
            </div>
          </Reveal>
          <Reveal dir="up" delay={80}>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
              Ready to Transform<br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Your Studies?
              </span>
            </h2>
          </Reveal>
          <Reveal dir="up" delay={160}>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              Join 50,000+ students studying smarter with AI. No credit card required.
            </p>
          </Reveal>
          <Reveal dir="up" delay={240}>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register"
                className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-base shadow-2xl shadow-purple-500/30 transition-all hover:scale-105">
                Create Free Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login"
                className="border border-white/20 hover:border-white/40 text-white px-10 py-4 rounded-xl font-bold text-base transition-all hover:bg-white/5">
                Already a member? Login
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─ Footer ─ */}
      <footer className="border-t border-white/10 bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                  <GraduationCap size={18} className="text-white" />
                </span>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">EduNexa</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                India's #1 AI-powered education platform. Study smarter, practice better, achieve more.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2">
                {['AI Tutor','AI Practice','DSA Learning','PDF Summarizer','Study Planner'].map(l => (
                  <li key={l}><Link to="/register" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2">
                {[['Login','/login'],['Register','/register'],['Dashboard','/dashboard']].map(([l,h]) => (
                  <li key={l}><Link to={h} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-xs">© 2024 EduNexa. All rights reserved.</p>
            <p className="text-gray-600 text-xs flex items-center gap-1">Made with <span className="text-red-500">♥</span> for Indian students</p>
          </div>
        </div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #6b21a8; border-radius: 10px; }
      `}</style>
    </div>
  );
}
