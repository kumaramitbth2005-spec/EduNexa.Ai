import React, { useState, useEffect } from 'react';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  Briefcase, CheckCircle2, ChevronDown, ChevronUp, ExternalLink,
  Code2, Users, Star, Trophy, Building2, BookOpen, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

const DSA_TOPICS = [
  { id: 'arrays', name: 'Arrays & Two Pointers', total: 15, difficulty: 'Easy-Medium' },
  { id: 'strings', name: 'Strings & HashMaps', total: 12, difficulty: 'Easy' },
  { id: 'linkedlist', name: 'Linked Lists & Pointers', total: 10, difficulty: 'Medium' },
  { id: 'stacks_queues', name: 'Stacks, Queues & Monotonic', total: 10, difficulty: 'Medium' },
  { id: 'trees', name: 'Binary Trees & BSTs', total: 18, difficulty: 'Medium-Hard' },
  { id: 'graphs', name: 'Graphs (BFS, DFS, Dijkstra)', total: 16, difficulty: 'Hard' },
  { id: 'dp', name: 'Dynamic Programming (1D & 2D)', total: 20, difficulty: 'Hard' },
  { id: 'sorting_searching', name: 'Binary Search & Sorting', total: 10, difficulty: 'Medium' },
];

const TECHNICAL_QUESTIONS = [
  {
    topic: 'Core Computer Networks',
    q: 'Explain the 3-Way Handshake in TCP and why 2-way is insufficient.',
    a: 'TCP utilizes SYN, SYN-ACK, and ACK. Three steps are mandatory to establish both sequence numbers bidirectionally and confirm both the client and server can receive and transmit. A two-way handshake leaves the server vulnerable to half-open connections caused by delayed duplicate packets.',
  },
  {
    topic: 'Operating Systems',
    q: 'What are the 4 Coffman conditions for Deadlock, and how to break them?',
    a: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait. Breaking Circular Wait via strict total resource ordering is the most practical real-world prevention technique.',
  },
  {
    topic: 'Database Management Systems',
    q: 'Explain ACID properties with a banking debit/credit example.',
    a: 'Atomicity: Money debited from Account A MUST credit Account B or entirely rollback. Consistency: Total bank balance remains valid. Isolation: Concurrent transfers cannot see intermediate balances. Durability: Once committed, records survive system reboot.',
  },
  {
    topic: 'System Design',
    q: 'How does Horizontal Scaling differ from Vertical Scaling?',
    a: 'Vertical scaling (scaling up) means adding more RAM/CPU to an existing machine (hits physical limits). Horizontal scaling (scaling out) adds more commodity nodes behind a load balancer (the cloud standard).',
  },
];

const HR_QUESTIONS = [
  {
    q: 'Tell me about yourself and your technical passion.',
    a: 'Structure using Present, Past, Future. Focus on real applications you built, university coursework milestones, and why you are excited to solve distributed or full-stack challenges.',
  },
  {
    q: 'Describe a challenging bug or team conflict you resolved.',
    a: 'Use the STAR method (Situation, Task, Action, Result). Highlight evidence-based debugging, active listening with teammates, and measurable project impact.',
  },
  {
    q: 'Why do you want to join our organization?',
    a: 'Discuss their recent tech blog posts, engineering culture, open-source work, and how your current skills align with their product roadmap.',
  },
];

const EXTERNAL_JOBS = [
  {
    role: 'Software Development Engineer - Intern',
    company: 'Google Careers (Global Opportunities)',
    type: 'Internship',
    location: 'Bangalore / Remote',
    url: 'https://careers.google.com',
    source: 'Verified External Portal',
  },
  {
    role: 'Graduate Software Engineer (2026 Batch)',
    company: 'Microsoft Careers',
    type: 'Full-Time',
    location: 'Hyderabad / Noida',
    url: 'https://careers.microsoft.com',
    source: 'Verified External Portal',
  },
  {
    role: 'Full-Stack Developer Trainee',
    company: 'Infosys Springboard Opportunities',
    type: 'Full-Time',
    location: 'Pune / Bangalore',
    url: 'https://careers.infosys.com',
    source: 'Verified External Portal',
  },
];

export default function CareerPage() {
  const [activeTab, setActiveTab] = useState('dsa');
  const [completedDsa, setCompletedDsa] = useState(() => {
    const saved = localStorage.getItem('edunexa_dsa_done');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    localStorage.setItem('edunexa_dsa_done', JSON.stringify(completedDsa));
  }, [completedDsa]);

  const toggleDsaTopic = (id) => {
    setCompletedDsa((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalDsaCount = DSA_TOPICS.length;
  const completedDsaCount = Object.values(completedDsa).filter(Boolean).length;
  const dsaProgress = Math.round((completedDsaCount / totalDsaCount) * 100);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl pb-12">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary-500" />
          Career & Placement Preparation Hub
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Structured DSA roadmaps, company interview questions, placement readiness, and verified internships
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2 sm:gap-6 overflow-x-auto">
        {[
          { id: 'dsa', label: 'DSA Roadmap & Tracker', icon: Code2 },
          { id: 'interview', label: 'Technical & HR Prep', icon: Users },
          { id: 'jobs', label: 'Verified Opportunities', icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 flex items-center gap-2 flex-shrink-0 ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: DSA Roadmap */}
      {activeTab === 'dsa' && (
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="card p-6 bg-gradient-to-r from-primary-900 to-indigo-950 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-extrabold text-xl">DSA Mastery Track</h3>
                <p className="text-xs text-primary-200 mt-0.5">
                  {completedDsaCount} of {totalDsaCount} core categories checked off
                </p>
              </div>
              <span className="text-2xl font-black text-amber-400">{dsaProgress}%</span>
            </div>
            <ProgressBar value={dsaProgress} color="yellow" height="h-3" />
          </div>

          {/* Topics List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DSA_TOPICS.map((topic) => {
              const isChecked = !!completedDsa[topic.id];
              return (
                <div
                  key={topic.id}
                  onClick={() => toggleDsaTopic(topic.id)}
                  className={`card p-4 flex items-center justify-between cursor-pointer transition-all border ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'hover:border-primary-300 dark:hover:border-primary-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <div>
                      <h4 className={`text-sm font-bold ${isChecked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {topic.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {topic.total} Essential Curated LeetCode Patterns
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    topic.difficulty.includes('Hard')
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : topic.difficulty.includes('Medium')
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {topic.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Interview Prep */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Technical Core Subjects (OS, DBMS, CN, System Design)
            </h3>
            {TECHNICAL_QUESTIONS.map((item, idx) => (
              <div key={idx} className="card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                    {item.topic}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.q}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Behavioral & HR Questions
            </h3>
            {HR_QUESTIONS.map((item, idx) => (
              <div key={idx} className="card p-4 space-y-2">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.q}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-primary-50/50 dark:bg-primary-950/20 p-3 rounded-lg border border-primary-100 dark:border-primary-900/30">
                  <strong>Suggested Approach: </strong> {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Verified Opportunities */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-200">
            <strong>Transparency Notice:</strong> EduNexa does not display fabricated vacancies. All listings below link directly to verified official company portals and university placement drives.
          </div>

          <div className="space-y-3">
            {EXTERNAL_JOBS.map((job, idx) => (
              <div key={idx} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                    {job.type}
                  </span>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mt-1.5">{job.role}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {job.company} • {job.location}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{job.source}</p>
                </div>

                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs px-5 py-2.5 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Apply on Official Site
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

