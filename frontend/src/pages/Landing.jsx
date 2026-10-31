import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Sparkles, Brain, BookOpen,
  Users, ArrowRight, Zap, Star, Code2, Target, Award,
  FileText, CheckCircle2, BarChart2, MessageSquare,
  Lightbulb, Shield, ChevronDown
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────── */
const TOTAL_FRAMES = 300;
const FOLDER       = '/ezgif-1c596d5b01f79a61-jpg';
const pad          = (n) => String(n).padStart(3, '0');
const frameUrl     = (n) => `${FOLDER}/ezgif-frame-${pad(n)}.jpg`;

/* ─── Scroll-reveal (for static sections below) ──── */
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
  const t = {
    up: 'translateY(50px)',
    left: 'translateX(-60px)',
    right: 'translateX(60px)',
    fade: 'scale(0.95)',
    zoom: 'scale(0.9)'
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : (t[dir] || t.up),
        transition: `opacity .7s cubic-bezier(.4,0,.2,1) ${delay}ms, transform .7s cubic-bezier(.4,0,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Calculate Panel Style (Zero Gaps, Smooth Crossfade) ─── */
function getPanelStyle(progress, from, to, isFirst = false, isLast = false) {
  if (progress < from || progress > to) {
    return { display: 'none', opacity: 0, pointerEvents: 'none' };
  }

  const span = to - from;
  const fadeSpan = span * 0.22; // 22% fade in/out zone

  let opacity = 1;
  let ty = 0;

  if (!isFirst && progress < from + fadeSpan) {
    const t = (progress - from) / fadeSpan;
    opacity = Math.max(0, Math.min(1, t));
    ty = (1 - opacity) * 35;
  } else if (!isLast && progress > to - fadeSpan) {
    const t = (to - progress) / fadeSpan;
    opacity = Math.max(0, Math.min(1, t));
    ty = (1 - opacity) * -35;
  }

  return {
    opacity,
    transform: `translateY(${ty}px)`,
    pointerEvents: opacity > 0.4 ? 'auto' : 'none',
    transition: 'opacity 0.12s ease-out, transform 0.12s ease-out'
  };
}

/* ─── Overlay Text Panel ─── */
function OverlayPanel({ progress, from, to, isFirst, isLast, align = 'center', children }) {
  const style = getPanelStyle(progress, from, to, isFirst, isLast);
  if (style.display === 'none') return null;

  const alignCls =
    align === 'left'   ? 'items-start text-left pl-8 sm:pl-16 md:pl-28' :
    align === 'right'  ? 'items-end text-right pr-8 sm:pr-16 md:pr-28' :
                         'items-center text-center px-6';

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-center ${alignCls}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SCROLL-SCRUBBED CANVAS BACKGROUND (Zero Blank Screen)
══════════════════════════════════════════════════════ */
function ScrollCanvas({ children }) {
  const wrapRef     = useRef(null);
  const canvasRef   = useRef(null);
  const imgsRef     = useRef([]);
  const curFrameRef = useRef(0);
  const rafRef      = useRef(null);
  const [progress, setProgress] = useState(0);

  /* Draw frame with fallback to nearest loaded frame */
  const drawFrame = useCallback((targetIdx) => {
    const c = canvasRef.current;
    if (!c) return;

    let img = imgsRef.current[targetIdx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Find nearest loaded frame so canvas NEVER goes black
      const total = imgsRef.current.length;
      for (let offset = 1; offset < 40; offset++) {
        const left = targetIdx - offset;
        const right = targetIdx + offset;
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
      img = imgsRef.current[0]; // fallback to frame 1
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

  /* Preload frames: Frame 1 immediately, others smoothly in background */
  useEffect(() => {
    const imgs = new Array(TOTAL_FRAMES).fill(null);
    imgsRef.current = imgs;

    // Load Frame 1 FIRST so initial view renders in 0ms
    const firstImg = new Image();
    firstImg.onload = () => {
      imgs[0] = firstImg;
      drawFrame(0);
    };
    firstImg.src = frameUrl(1);

    // Load every frame in background
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.onload = () => {
        imgs[i - 1] = img;
        if (curFrameRef.current === i - 1) {
          drawFrame(i - 1);
        }
      };
      img.src = frameUrl(i);
      imgs[i - 1] = img;
    }
  }, [drawFrame]);

  /* Resize listener */
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

  /* Scroll listener mapping scroll progress to 0-1 */
  useEffect(() => {
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) return;

      const scrolled = -rect.top;
      const prog = Math.min(1, Math.max(0, scrolled / total));
      setProgress(prog);

      const target = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(prog * (TOTAL_FRAMES - 1))));
      if (target !== curFrameRef.current) {
        curFrameRef.current = target;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(target));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [drawFrame]);

  return (
    <div ref={wrapRef} className="relative" style={{ height: '360vh' }}>
      {/* Sticky Fullscreen Canvas Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-gray-950">
        {/* The Frame Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlay for Crisp Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-black/75 pointer-events-none" />

        {/* Content Overlays */}
        <div className="relative z-10 h-full w-full">
          {typeof children === 'function' ? children(progress) : children}
        </div>

        {/* Subtle Bottom Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Static Feature Card ─── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <Reveal delay={delay} dir="up">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
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
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-purple-500/30">
          {num}
        </div>
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
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
        </div>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">"{text}"</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {avatar}
          </div>
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
   MAIN LANDING PAGE
═══════════════════════════════════════════════════ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 50);
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

  const stats = [
    { value: '50K+',  label: 'Active Students',      icon: Users,    color: 'bg-purple-500/20 text-purple-400', delay: 0   },
    { value: '200+',  label: 'Courses & Subjects',   icon: BookOpen, color: 'bg-blue-500/20 text-blue-400',     delay: 80  },
    { value: '1M+',   label: 'Questions Generated',  icon: Zap,      color: 'bg-cyan-500/20 text-cyan-400',     delay: 160 },
    { value: '98%',   label: 'Student Satisfaction', icon: Star,     color: 'bg-yellow-500/20 text-yellow-400', delay: 240 },
  ];

  const testimonials = [
    { name: 'Arjun Sharma',  role: 'B.Tech CSE, IIT Delhi',     avatar: 'A', delay: 0,   text: "EduNexa's AI tutor helped me crack my semester exams. The personalized practice questions are spot-on and DSA section is incredibly detailed." },
    { name: 'Priya Patel',   role: 'MCA Student, CDAC',         avatar: 'P', delay: 80,  text: 'I love how the platform generates practice questions based on exactly what I studied. The progress analytics keep me motivated every day.' },
    { name: 'Rahul Verma',   role: 'BCA, Amity University',     avatar: 'R', delay: 160, text: 'The PDF summarizer saved me hours during exam prep. I uploaded my entire textbook and got a perfect summary in under a minute!' },
    { name: 'Sneha Gupta',   role: 'B.Sc CS, Delhi University',  avatar: 'S', delay: 240, text: 'Finally a platform that understands Indian curriculum. The subject notes and quiz system is exactly what I needed.' },
    { name: 'Vikram Singh',  role: 'M.Tech, NIT Trichy',        avatar: 'V', delay: 320, text: 'The AI practice system adapts to my weak areas. My problem-solving speed improved dramatically in just 3 weeks.' },
    { name: 'Ananya Mehta',  role: 'B.Tech IT, VIT Vellore',    avatar: 'A', delay: 400, text: 'EduNexa is the only platform where I feel like I have a personal mentor. The AI explains things my professors never could.' },
  ];

  return (
    <div className="bg-gray-950 text-white overflow-x-hidden selection:bg-purple-500 selection:text-white">

      {/* ── Fixed Navbar ──────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/10 shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-md shadow-purple-500/20">
              <GraduationCap size={20} className="text-white" />
            </span>
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">EduNexa</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300 font-medium">
            <a href="#features"     className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 font-medium">Login</Link>
            <Link to="/register" className="text-sm bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:scale-105">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          SCROLL-SCRUBBED FULLPAGE BACKGROUND
          Zero gap, seamless overlapping crossfades
      ══════════════════════════════════════════════ */}
      <ScrollCanvas>
        {(progress) => (
          <>
            {/* ── Panel 0: HERO (0.00 – 0.24) ── */}
            <OverlayPanel progress={progress} from={0.00} to={0.24} isFirst={true} align="center">
              <div className="flex flex-col items-center gap-5 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-200 text-sm backdrop-blur-md shadow-lg">
                  <Sparkles size={14} className="text-purple-300 animate-pulse" />
                  <span>India's #1 AI-Powered Smart Education Platform</span>
                </div>

                <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black leading-tight drop-shadow-2xl text-center">
                  Study Smarter with{' '}
                  <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    AI Intelligence
                  </span>
                </h1>

                <p className="text-gray-200 text-base sm:text-lg max-w-2xl text-center leading-relaxed drop-shadow-md">
                  Personalized AI tutoring, adaptive practice sessions, DSA problem solving, and intelligent progress tracking — tailored for your curriculum.
                </p>

                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  <Link
                    to="/register"
                    className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-2xl shadow-purple-500/40 transition-all hover:scale-105"
                  >
                    Start Learning Free
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 border border-white/30 hover:border-white/60 bg-white/10 backdrop-blur-md text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-white/20"
                  >
                    Sign In
                  </Link>
                </div>

                {/* Quick stats chips */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-4">
                  {[['50K+','Students'],['200+','Subjects'],['1M+','Questions'],['100%','Free']].map(([v, l]) => (
                    <div key={l} className="flex flex-col items-center">
                      <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">{v}</span>
                      <span className="text-gray-300 text-xs">{l}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-1 text-white/70 text-xs mt-3 animate-bounce">
                  <span>Scroll to explore features</span>
                  <ChevronDown size={16} />
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 1: AI TUTOR (0.20 – 0.44) ── */}
            <OverlayPanel progress={progress} from={0.20} to={0.44} align="left">
              <div className="max-w-lg bg-black/40 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-200 text-xs mb-4">
                  <Brain size={13} className="text-purple-300" /> 24/7 AI Tutor
                </div>
                <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight text-white drop-shadow-xl">
                  Ask Anything.<br />
                  <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    Learn Instantly.
                  </span>
                </h2>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-6">
                  Get clear, step-by-step solutions with real examples for any complex topic — from calculus to computer science algorithms.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Data Structures', 'Operating Systems', 'Mathematics', 'DBMS', 'Computer Networks'].map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs backdrop-blur-sm">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 2: AI PRACTICE (0.40 – 0.64) ── */}
            <OverlayPanel progress={progress} from={0.40} to={0.64} align="right">
              <div className="max-w-lg bg-black/40 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 text-xs mb-4">
                  <Target size={13} className="text-cyan-300" /> Personalized Practice
                </div>
                <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight text-white drop-shadow-xl">
                  Targeted<br />
                  <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    Practice Sessions.
                  </span>
                </h2>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-6">
                  Stop studying blindly. EduNexa automatically generates MCQs, coding challenges, and descriptive questions based on your study history.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[['Topic MCQs', '✓'], ['Coding Problems', '✓'], ['Written Analysis', '✓'], ['Adaptive Feedback', '✓']].map(([l, c]) => (
                    <div key={l} className="flex items-center gap-2 text-white font-medium">
                      <span className="text-green-400 font-bold">{c}</span> {l}
                    </div>
                  ))}
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 3: ANALYTICS & DSA (0.60 – 0.84) ── */}
            <OverlayPanel progress={progress} from={0.60} to={0.84} align="left">
              <div className="max-w-lg bg-black/40 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/40 bg-yellow-500/20 text-yellow-200 text-xs mb-4">
                  <BarChart2 size={13} className="text-yellow-300" /> Real-time Analytics
                </div>
                <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight text-white drop-shadow-xl">
                  Know Where<br />
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    You Stand.
                  </span>
                </h2>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-6">
                  Comprehensive mastery dashboards highlight strengths and pinpoint weak concepts before exams.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['91%', 'Avg Accuracy'], ['47', 'Topics Mastered'], ['21', 'Day Streak']].map(([v, l]) => (
                    <div key={l} className="p-3 rounded-2xl bg-white/10 border border-white/10">
                      <div className="text-2xl font-black text-yellow-300">{v}</div>
                      <div className="text-gray-300 text-[11px] mt-1">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </OverlayPanel>

            {/* ── Panel 4: FINAL CTA (0.80 – 1.00) ── */}
            <OverlayPanel progress={progress} from={0.80} to={1.00} isLast={true} align="center">
              <div className="flex flex-col items-center gap-5 max-w-xl bg-black/50 backdrop-blur-lg p-8 sm:p-10 rounded-3xl border border-white/20 shadow-2xl text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/15 text-white text-sm">
                  <GraduationCap size={15} /> Join 50,000+ Smart Learners
                </div>
                <h2 className="text-3xl sm:text-5xl font-black leading-tight text-white drop-shadow-xl">
                  Ready to Supercharge<br />
                  <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    Your Education?
                  </span>
                </h2>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-md">
                  Everything you need to excel in exams, interviews, and academic coursework. 100% free to get started.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  <Link
                    to="/register"
                    className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-2xl shadow-purple-500/40 transition-all hover:scale-105"
                  >
                    Create Free Account
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="border border-white/30 hover:border-white/60 bg-white/10 text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-white/20"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </OverlayPanel>
          </>
        )}
      </ScrollCanvas>

      {/* ══════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════════ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-4">
                <Sparkles size={13} /> Complete Learning Suite
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">All The Tools You Need To Succeed</h2>
              <p className="text-gray-400 max-w-xl mx-auto">From AI-powered tutoring to adaptive practice, everything is tailored to help you excel.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 50} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm mb-4">
                <Target size={13} /> Fast & Intuitive
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">How EduNexa Works</h2>
              <p className="text-gray-400">Get up and running in under 2 minutes.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Sign Up & Set Goals',   desc: 'Create your account in seconds and specify your degree, branch, and target exams.' },
              { num: '2', title: 'Learn with AI Guidance', desc: 'Read curated notes, run practice quizzes, ask AI doubts, and master DSA concepts.' },
              { num: '3', title: 'Track & Excel',          desc: 'Monitor real-time analytics, close topic knowledge gaps, and achieve top grades.' },
            ].map((s, i) => <StepCard key={i} {...s} delay={i * 100} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm mb-4">
                <Star size={13} className="fill-yellow-400" /> Student Feedback
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Trusted by Thousands Across India</h2>
              <p className="text-gray-400 max-w-md mx-auto">Real students sharing their genuine experiences with EduNexa.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => <TestiCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUST BAR
      ══════════════════════════════════════════════ */}
      <section className="py-14 border-y border-white/5 bg-white/[0.02]">
        <Reveal dir="up">
          <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-gray-400 text-sm">
            {[
              { icon: Shield,       label: 'Secure & Private'    },
              { icon: Zap,          label: 'Powered by Gemini AI' },
              { icon: Users,        label: '50,000+ Students'     },
              { icon: Star,         label: '4.9 / 5 Rating'       },
              { icon: CheckCircle2, label: '100% Free to Start'   },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 hover:text-gray-200 transition-colors">
                <Icon size={16} className="text-purple-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[5%]   w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[5%] w-[400px] h-[400px] bg-blue-600/20   rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal dir="zoom">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-6">
              <GraduationCap size={14} /> Join EduNexa Today
            </div>
          </Reveal>
          <Reveal dir="up" delay={80}>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
              Ready to Upgrade<br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Your Academic Journey?
              </span>
            </h2>
          </Reveal>
          <Reveal dir="up" delay={160}>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
              Join students who are achieving higher marks and building solid conceptual mastery with AI assistance.
            </p>
          </Reveal>
          <Reveal dir="up" delay={240}>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-base shadow-2xl shadow-purple-500/30 transition-all hover:scale-105"
              >
                Create Free Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="border border-white/20 hover:border-white/40 text-white px-10 py-4 rounded-xl font-bold text-base transition-all hover:bg-white/5"
              >
                Sign In
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
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
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Smart AI education platform empowering students with tailored learning intelligence and practice workflows.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Features</h4>
              <ul className="space-y-2">
                {['AI Tutor','AI Practice','DSA Learning','PDF Summarizer','Study Planner'].map((l) => (
                  <li key={l}>
                    <Link to="/register" className="text-gray-400 hover:text-gray-200 text-sm transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2">
                {[['Login','/login'],['Register','/register'],['Dashboard','/dashboard']].map(([l, h]) => (
                  <li key={l}>
                    <Link to={h} className="text-gray-400 hover:text-gray-200 text-sm transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">© 2026 EduNexa. All rights reserved.</p>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              Made with <span className="text-red-500">♥</span> for Indian students
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #6b21a8; border-radius: 10px; }
      `}</style>
    </div>
  );
}
