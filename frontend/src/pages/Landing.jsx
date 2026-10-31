import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Sparkles, Brain, BookOpen, PenSquare,
  Users, ArrowRight, Zap, Star, Code2, Target, Award,
  FileText, CheckCircle2, Play, Pause, ChevronDown,
  BarChart2, MessageSquare, Lightbulb, Shield
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────── */
const TOTAL_FRAMES = 300;
const FRAME_FOLDER = '/ezgif-1c596d5b01f79a61-jpg';
const pad = (n) => String(n).padStart(3, '0');
const frameUrl = (n) => `${FRAME_FOLDER}/ezgif-frame-${pad(n)}.jpg`;

/* ─── Scroll-reveal hook ─────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Reveal wrapper ─────────────────────────────── */
function Reveal({ children, delay = 0, dir = 'up', className = '' }) {
  const [ref, visible] = useScrollReveal();
  const transforms = {
    up: 'translateY(60px)',
    down: 'translateY(-60px)',
    left: 'translateX(-70px)',
    right: 'translateX(70px)',
    fade: 'scale(0.92)',
    zoom: 'scale(0.85)',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[dir] || transforms.up,
        transition: `opacity 0.8s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.8s cubic-bezier(.4,0,.2,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

/* ─── Canvas GIF Player ──────────────────────────── */
function GifPlayer({ className = '', autoplay = true, step = 3 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(1);
  const imagesRef = useRef([]);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(autoplay);
  const playingRef = useRef(autoplay);
  const FPS = 24;
  const INTERVAL = 1000 / FPS;

  // Load every `step`-th frame
  useEffect(() => {
    const indices = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += step) indices.push(i);
    let done = 0;
    const imgs = new Array(indices.length);
    imagesRef.current = imgs;

    indices.forEach((fn, idx) => {
      const img = new Image();
      img.onload = () => {
        imgs[idx] = img;
        done++;
        if (done === indices.length) setLoaded(true);
      };
      img.onerror = () => { done++; if (done === indices.length) setLoaded(true); };
      img.src = frameUrl(fn);
    });
    return () => { imagesRef.current = []; };
  }, [step]);

  // Animation loop
  const animate = useCallback((ts) => {
    if (!playingRef.current) return;
    if (ts - lastTimeRef.current >= INTERVAL) {
      lastTimeRef.current = ts;
      const imgs = imagesRef.current;
      const total = imgs.length;
      let fi = frameRef.current % total;
      let img = imgs[fi];
      let tries = 0;
      while (!img && tries < total) { fi = (fi + 1) % total; img = imgs[fi]; tries++; }
      if (img) {
        const c = canvasRef.current;
        if (c) {
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, c.width, c.height);
        }
      }
      frameRef.current = (frameRef.current + 1) % total;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [INTERVAL]);

  useEffect(() => {
    if (loaded && playing) {
      playingRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    } else {
      playingRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loaded, playing, animate]);

  const toggle = () => setPlaying(p => { playingRef.current = !p; return !p; });

  return (
    <div className={`relative group ${className}`}>
      {/* Glow border */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative rounded-2xl overflow-hidden bg-gray-950 shadow-2xl">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10 gap-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading preview…</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-auto block"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}
        />
        {/* Play/Pause overlay */}
        {loaded && (
          <button
            onClick={toggle}
            className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Static Frame Snapshot ──────────────────────── */
function FrameSnap({ frame, alt = 'EduNexa preview', className = '' }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
        <img
          src={frameUrl(frame)}
          alt={alt}
          className="w-full h-auto block"
          loading="lazy"
        />
      </div>
    </div>
  );
}

/* ─── Floating Badge ──────────────────────────────── */
function Badge({ icon: Icon, label, sub, color, style }) {
  return (
    <div
      style={style}
      className={`absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/90 border border-gray-700/80 backdrop-blur-md shadow-xl text-white text-xs z-10`}
    >
      <span className={`p-1.5 rounded-lg ${color}`}><Icon size={14} /></span>
      <div>
        <div className="font-semibold leading-tight">{label}</div>
        {sub && <div className="text-gray-400 text-[10px]">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────── */
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

/* ─── Feature Card ────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <Reveal delay={delay} dir="up">
      <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
        <span className={`inline-flex p-3 rounded-xl mb-4 ${color}`}><Icon size={22} /></span>
        <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

/* ─── Step Card ────────────────────────────────────── */
function StepCard({ num, title, desc, delay }) {
  return (
    <Reveal delay={delay} dir="up">
      <div className="relative flex flex-col items-center text-center p-7 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors duration-300">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-purple-500/30">
          {num}
        </div>
        <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

/* ─── Testimonial Card ────────────────────────────── */
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
  /* ── Navbar scroll ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: Brain,         title: 'AI Tutor',              color: 'bg-purple-500/20 text-purple-400', desc: 'Get instant answers to any academic question, explained step by step with examples.' },
    { icon: FileText,      title: 'PDF Summarizer',        color: 'bg-blue-500/20 text-blue-400',     desc: 'Upload any PDF textbook or notes and get a crisp AI-generated summary in seconds.' },
    { icon: Zap,           title: 'Question Generator',    color: 'bg-cyan-500/20 text-cyan-400',     desc: 'Auto-generate MCQs, conceptual, written, and coding questions for any topic.' },
    { icon: Code2,         title: 'DSA Learning',          color: 'bg-green-500/20 text-green-400',   desc: 'Master Data Structures & Algorithms with visual explanations and practice problems.' },
    { icon: Target,        title: 'AI Practice System',    color: 'bg-orange-500/20 text-orange-400', desc: 'Personalized adaptive practice sessions that improve based on your performance.' },
    { icon: BookOpen,      title: 'Subject Notes',         color: 'bg-pink-500/20 text-pink-400',     desc: 'Organized subject-wise notes with smart search and AI-powered insights.' },
    { icon: BarChart2,     title: 'Progress Analytics',    color: 'bg-yellow-500/20 text-yellow-400', desc: 'Track your learning journey with detailed performance analytics and streaks.' },
    { icon: MessageSquare, title: 'Smart Quizzes',         color: 'bg-red-500/20 text-red-400',       desc: 'Topic-aware quizzes with instant feedback and detailed explanations.' },
    { icon: Lightbulb,     title: 'Study Planner',         color: 'bg-indigo-500/20 text-indigo-400', desc: 'AI-powered study schedules that adapt to your goals, pace, and exam dates.' },
  ];

  const showcaseSections = [
    { frame: 30,  dir: 'right', textDir: 'left',  badge: 'AI Tutor', title: 'Ask Anything. Learn Instantly.', desc: 'Your personal AI tutor is available 24/7. Get clear, step-by-step explanations for any concept — from basic algebra to advanced algorithms. EduNexa understands your level and adapts accordingly.' },
    { frame: 90,  dir: 'left',  textDir: 'right', badge: 'Practice', title: 'Personalized Practice Sessions.', desc: 'Stop studying blindly. EduNexa generates topic-specific MCQs, coding problems, and descriptive questions based on exactly what you just studied — and tracks every attempt.' },
    { frame: 160, dir: 'right', textDir: 'left',  badge: 'Analytics', title: 'Know Where You Stand.', desc: 'Detailed progress dashboards show your strengths, weaknesses, streaks, and topic mastery — so you always know what to study next for maximum improvement.' },
    { frame: 230, dir: 'left',  textDir: 'right', badge: 'DSA', title: 'Master DSA Like Never Before.', desc: 'Visual DSA explanations, problem walkthroughs, and AI-guided practice. From arrays to dynamic programming — EduNexa makes the hardest topics click.' },
  ];

  const stats = [
    { value: '50K+',  label: 'Active Students',      icon: Users,       color: 'bg-purple-500/20 text-purple-400', delay: 0   },
    { value: '200+',  label: 'Courses & Subjects',   icon: BookOpen,    color: 'bg-blue-500/20 text-blue-400',     delay: 100 },
    { value: '1M+',   label: 'Questions Generated',  icon: Zap,         color: 'bg-cyan-500/20 text-cyan-400',     delay: 200 },
    { value: '98%',   label: 'Student Satisfaction', icon: Star,        color: 'bg-yellow-500/20 text-yellow-400', delay: 300 },
  ];

  const steps = [
    { num: '1', title: 'Create Your Account',     desc: 'Sign up free and set up your student profile with your subjects, syllabus, and learning goals.' },
    { num: '2', title: 'Study With AI Support',   desc: 'Read notes, watch DSA topics, ask the AI tutor questions, and upload PDFs for instant summaries.' },
    { num: '3', title: 'Practice & Improve',      desc: 'Take AI-generated practice sessions, review your mistakes, and watch your mastery grow every day.' },
  ];

  const testimonials = [
    { name: 'Arjun Sharma',   role: 'B.Tech CSE, IIT Delhi',   avatar: 'A', text: 'EduNexa\'s AI tutor helped me crack my semester exams. The personalized practice questions are spot-on and the DSA section is incredibly detailed.',    delay: 0   },
    { name: 'Priya Patel',    role: 'MCA Student, CDAC',        avatar: 'P', text: 'I love how the platform generates practice questions based on exactly what I studied. The progress analytics keep me motivated every single day.',        delay: 100 },
    { name: 'Rahul Verma',    role: 'BCA, Amity University',    avatar: 'R', text: 'The PDF summarizer saved me hours during exam prep. I uploaded my entire textbook and got a perfect summary in under a minute!',                        delay: 200 },
    { name: 'Sneha Gupta',    role: 'B.Sc CS, Delhi University', avatar: 'S', text: 'Finally, a study platform that actually understands Indian curriculum. The subject notes and quiz system is exactly what I needed.',                    delay: 300 },
    { name: 'Vikram Singh',   role: 'M.Tech, NIT Trichy',       avatar: 'V', text: 'The AI practice system adapts to my weak areas and keeps pushing me. My problem-solving speed has improved dramatically in just 3 weeks.', delay: 400 },
    { name: 'Ananya Mehta',   role: 'B.Tech IT, VIT Vellore',   avatar: 'A', text: 'EduNexa is the only platform where I feel like I have a personal mentor. The AI tutor explains things in a way my professors never could.',             delay: 500 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* ── Navbar ───────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/10 shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <GraduationCap size={20} className="text-white" />
            </span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">EduNexa</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features"     className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#showcase"     className="hover:text-white transition-colors">Showcase</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">Login</Link>
            <Link to="/register" className="text-sm bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%]   w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute top-[20%]  right-[-10%] w-[400px] h-[400px] bg-blue-600/20   rounded-full blur-3xl" />
          <div className="absolute bottom-0  left-[30%]   w-[350px] h-[350px] bg-cyan-600/15   rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text — these animate on scroll (hero is above fold so starts with slight opacity) */}
            <div className="flex flex-col gap-6">
              {/* Tag */}
              <Reveal dir="up" delay={0}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm w-fit">
                  <Sparkles size={14} />
                  <span>India's #1 AI-Powered Study Platform</span>
                </div>
              </Reveal>

              {/* Heading */}
              <Reveal dir="up" delay={100}>
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black leading-tight">
                  Study Smarter with{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    AI Intelligence
                  </span>
                </h1>
              </Reveal>

              {/* Sub */}
              <Reveal dir="up" delay={200}>
                <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                  EduNexa is your complete AI-powered education companion — personalized practice,
                  instant AI tutoring, smart quizzes, DSA mastery, and deep progress analytics.
                  All in one platform.
                </p>
              </Reveal>

              {/* Pills */}
              <Reveal dir="up" delay={280}>
                <div className="flex flex-wrap gap-2">
                  {['AI Tutor', 'Smart Practice', 'PDF Summarizer', 'DSA Learning', 'Progress Tracking'].map(p => (
                    <span key={p} className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-gray-300 text-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </Reveal>

              {/* CTAs */}
              <Reveal dir="up" delay={360}>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/register"
                    className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base shadow-xl shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40"
                  >
                    Start Learning Free
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-300 hover:bg-white/5"
                  >
                    Sign In
                  </Link>
                </div>
              </Reveal>

              {/* Quick stats row */}
              <Reveal dir="up" delay={440}>
                <div className="flex flex-wrap gap-6 pt-2">
                  {[['50K+','Students'],['200+','Subjects'],['1M+','Questions'],['Free','Forever']].map(([v,l]) => (
                    <div key={l} className="flex flex-col">
                      <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{v}</span>
                      <span className="text-gray-500 text-xs">{l}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: GIF Player */}
            <div className="relative">
              <Reveal dir="right" delay={150}>
                <GifPlayer className="w-full" autoplay={true} step={3} />
              </Reveal>

              {/* Floating badges */}
              <Badge icon={CheckCircle2} label="AI Powered"    sub="Gemini 1.5 Pro"  color="bg-purple-500/30 text-purple-300" style={{ top: '-16px',  left: '-24px', animation: 'floatY 3s ease-in-out infinite' }} />
              <Badge icon={Zap}          label="Instant Answer" sub="< 2s response"   color="bg-blue-500/30 text-blue-300"     style={{ bottom: '20px', left: '-20px', animation: 'floatY 3.5s ease-in-out infinite 0.6s' }} />
              <Badge icon={Award}        label="Top Rated"      sub="4.9 ★ by students" color="bg-yellow-500/30 text-yellow-300" style={{ top: '40px',  right: '-20px', animation: 'floatY 4s ease-in-out infinite 1.2s' }} />
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-500 animate-bounce">
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown size={18} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS BAND
      ═══════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════════ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal dir="up" delay={0}>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-4">
                <Sparkles size={13} /> Everything You Need
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Powerful Features for Every Student
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                From AI-powered tutoring to adaptive practice — every tool is designed to accelerate your learning.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SHOWCASE SECTIONS (alternating)
      ═══════════════════════════════════════════════ */}
      <section id="showcase" className="py-8">
        {showcaseSections.map(({ frame, dir, textDir, badge, title, desc }, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div key={idx} className={`py-20 ${idx % 2 === 1 ? 'bg-white/[0.015]' : ''}`}>
              <div className="max-w-7xl mx-auto px-6">
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`} style={{ direction: isEven ? 'ltr' : 'rtl' }}>

                  {/* Image side */}
                  <Reveal dir={dir} delay={0}>
                    <div style={{ direction: 'ltr' }}>
                      <FrameSnap frame={frame} alt={title} />
                    </div>
                  </Reveal>

                  {/* Text side */}
                  <div style={{ direction: 'ltr' }} className="flex flex-col gap-5">
                    <Reveal dir={textDir} delay={100}>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs w-fit">
                        <Zap size={11} /> {badge}
                      </span>
                    </Reveal>
                    <Reveal dir={textDir} delay={180}>
                      <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">{title}</h2>
                    </Reveal>
                    <Reveal dir={textDir} delay={260}>
                      <p className="text-gray-400 leading-relaxed">{desc}</p>
                    </Reveal>
                    <Reveal dir={textDir} delay={340}>
                      <Link
                        to="/register"
                        className="group inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors"
                      >
                        Try it free <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Reveal>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm mb-4">
                <Target size={13} /> Simple Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">How EduNexa Works</h2>
              <p className="text-gray-400 max-w-md mx-auto">Get started in minutes. No prior setup required.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s, i) => <StepCard key={i} {...s} delay={i * 120} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FULL-WIDTH GIF BANNER
      ═══════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">See EduNexa in Action</h2>
              <p className="text-gray-400">Live preview of the full platform experience</p>
            </div>
          </Reveal>
          <Reveal dir="zoom" delay={100}>
            <GifPlayer className="max-w-4xl mx-auto" autoplay={true} step={2} />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section id="testimonials" className="py-24 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal dir="up">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm mb-4">
                <Star size={13} className="fill-yellow-400" /> Student Reviews
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Loved by 50,000+ Students</h2>
              <p className="text-gray-400 max-w-md mx-auto">Don't take our word for it. Here's what students across India are saying.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => <TestiCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TRUST BADGES
      ═══════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal dir="up">
            <div className="flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
              {[
                { icon: Shield,     label: 'Secure & Private' },
                { icon: Zap,        label: 'Powered by Gemini AI' },
                { icon: Users,      label: '50,000+ Students' },
                { icon: Star,       label: '4.9/5 Rating' },
                { icon: CheckCircle2, label: '100% Free to Start' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                  <Icon size={16} className="text-purple-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[10%]  w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[10%] w-[400px] h-[400px] bg-blue-600/20   rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal dir="zoom" delay={0}>
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
              Join 50,000+ students who are already studying smarter with AI.
              No credit card required. Start free today.
            </p>
          </Reveal>
          <Reveal dir="up" delay={240}>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-base shadow-2xl shadow-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                Create Free Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white px-10 py-4 rounded-xl font-bold text-base transition-all duration-300 hover:bg-white/5"
              >
                Already a member? Login
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                  <GraduationCap size={18} className="text-white" />
                </span>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">EduNexa</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                India's #1 AI-powered education platform. Study smarter, practice better, and achieve more.
              </p>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2">
                {['AI Tutor','Practice','DSA Learning','Quizzes','Study Planner'].map(l => (
                  <li key={l}><Link to="/register" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            {/* Account links */}
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
            <p className="text-gray-600 text-xs flex items-center gap-1">
              Made with <span className="text-red-500">♥</span> for Indian students
            </p>
          </div>
        </div>
      </footer>

      {/* ─── CSS Animations (injected inline) ─────────── */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-10px); }
        }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #6b21a8; border-radius: 10px; }
      `}</style>

    </div>
  );
}
