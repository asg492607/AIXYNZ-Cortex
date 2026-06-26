import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, AlertCircle, GitBranch, Database, ShieldCheck,
  Zap, Key, FileText, Users, ArrowRight, Github, Terminal,
  CheckCircle, Globe, Lock, Activity, Cpu, BarChart3,
  ChevronRight, Star, Twitter, Linkedin, Mail, ExternalLink,
  Cloud, Code2, Server, Layers
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── data ────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Cloud,       color: 'from-orange-500 to-amber-500',   title: 'AWS Security Scanner',      desc: 'Continuously scan IAM, S3, EC2, and RDS for misconfigurations and vulnerabilities.' },
  { icon: Github,      color: 'from-gray-500 to-slate-500',     title: 'GitHub Scanner',            desc: 'Detect exposed secrets, dependency vulnerabilities, and code security issues.' },
  { icon: Cpu,         color: 'from-violet-500 to-purple-500',  title: 'AI Security Copilot',       desc: 'LLM-powered analysis generates step-by-step remediation guidance for every finding.' },
  { icon: GitBranch,   color: 'from-rose-500 to-pink-500',      title: 'Attack Graph',              desc: 'Visualize blast radius and lateral movement paths across your infrastructure.' },
  { icon: Database,    color: 'from-blue-500 to-cyan-500',      title: 'Asset Inventory',           desc: 'Unified inventory of all cloud and code assets with per-asset aggregate risk scores.' },
  { icon: ShieldCheck, color: 'from-emerald-500 to-teal-500',   title: 'Compliance Mapping',        desc: 'Automatic control mapping to SOC 2, ISO 27001, and CIS benchmarks with drill-down.' },
  { icon: Zap,         color: 'from-yellow-500 to-amber-500',   title: 'Workflow Automation',       desc: 'Define condition-based rules to trigger Slack or email alerts for any event.' },
  { icon: Key,         color: 'from-indigo-500 to-blue-500',    title: 'Public API & Keys',         desc: 'Secure hash-backed API keys for CI/CD pipelines and external integrations.' },
  { icon: FileText,    color: 'from-teal-500 to-green-500',     title: 'Reporting & Audit Logs',    desc: 'Export findings as CSV or JSON and maintain a full immutable audit trail.' },
  { icon: Users,       color: 'from-pink-500 to-rose-500',      title: 'Multi-tenancy & RBAC',      desc: 'Fully isolated org boundaries with granular admin, analyst, and viewer roles.' },
];

const STACK = [
  { name: 'React',      color: '#61DAFB', letter: 'R' },
  { name: 'FastAPI',    color: '#009688', letter: 'F' },
  { name: 'Firebase',   color: '#FFCA28', letter: 'Fb' },
  { name: 'Docker',     color: '#2496ED', letter: 'D' },
  { name: 'Python',     color: '#3776AB', letter: 'Py' },
  { name: 'AWS SDK',    color: '#FF9900', letter: 'A' },
  { name: 'PyGitHub',   color: '#6e40c9', letter: 'G' },
  { name: 'Groq AI',    color: '#f97316', letter: 'AI' },
];

const MILESTONES = [
  { version: 'MVP-1', label: 'Security Command Center',   status: 'done',    desc: 'Core scanning, findings pipeline, dashboard, RBAC, integrations.' },
  { version: 'MVP-2', label: 'Security Operations Platform', status: 'done', desc: 'AI Copilot, Jira, Webhooks, Asset Inventory, Audit Logs.' },
  { version: 'MVP-3', label: 'AI Security Platform',      status: 'done',    desc: 'Attack Graph, Compliance V2, Workflows, API Keys, Single-service deploy.' },
  { version: 'MVP-4', label: 'Enterprise & Scale',        status: 'progress',desc: 'SSO, fine-grained permissions, multi-region, SLA tracking.' },
  { version: 'MVP-5', label: 'Autonomous Security OS',    status: 'future',  desc: 'Self-healing posture, predictive risk modeling, autonomous remediation.' },
];

const STEPS = [
  { num: '01', title: 'Connect', desc: 'Link your GitHub, AWS, and Jira accounts via our integrations dashboard.' },
  { num: '02', title: 'Scan',    desc: 'Cortex continuously scans your infrastructure and surfaces prioritised findings.' },
  { num: '03', title: 'Analyze', desc: 'Our AI Copilot explains every finding and generates step-by-step remediation.' },
  { num: '04', title: 'Remediate', desc: 'Track fix progress, suppress false positives, and manage SLAs per finding.' },
  { num: '05', title: 'Report',  desc: 'Export compliance reports, audit logs, and share posture snapshots.' },
];

const TEAM = [
  {
    name: 'Atharva Sameer Gandhi',
    role: 'Founder · AI & Security Engineer',
    bio: 'Leads architecture and development of AIXYNZ Cortex, focusing on AI-powered cybersecurity, backend systems, cloud security, and product engineering.',
    focus: ['AI & LLM Applications', 'Cybersecurity', 'Backend Engineering', 'Cloud & DevSecOps', 'System Design'],
    avatar: 'AG',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    name: 'Nayan Solanki',
    role: 'Co-Founder · Full-Stack & Platform Engineer',
    bio: 'Responsible for frontend development, platform integration, user experience, and transforming security workflows into intuitive interfaces.',
    focus: ['Full-Stack Development', 'React & Frontend Engineering', 'Product Development', 'API Integration', 'User Experience'],
    avatar: 'NS',
    color: 'from-emerald-500 to-teal-500',
  },
];

const APIS = [
  { method: 'GET',    path: '/api/v1/findings',        desc: 'List all findings with filters' },
  { method: 'POST',   path: '/api/v1/scan/rescan',     desc: 'Trigger a fresh security scan' },
  { method: 'POST',   path: '/api/v1/copilot/chat',    desc: 'Chat with AI Security Copilot' },
  { method: 'GET',    path: '/api/v1/assets',          desc: 'Get asset inventory with risk scores' },
  { method: 'GET',    path: '/api/v1/reports/compliance/{fw}', desc: 'Compliance posture by framework' },
  { method: 'POST',   path: '/api/v1/workflows',       desc: 'Create an automation workflow rule' },
  { method: 'POST',   path: '/api/v1/api-keys',        desc: 'Generate a new API key' },
  { method: 'GET',    path: '/api/v1/audit-logs',      desc: 'Retrieve the audit trail' },
];

const METHOD_COLOR = { GET: 'text-emerald-400 bg-emerald-400/10', POST: 'text-blue-400 bg-blue-400/10', DELETE: 'text-red-400 bg-red-400/10' };

/* ─── sub-components ──────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Pill({ children, color = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' }) {
  return <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${color}`}>{children}</span>;
}

/* ─── Sections ─────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-24">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-indigo-900/20 to-transparent" />
      </div>
      {/* Grid pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="max-w-5xl mx-auto text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="flex items-center gap-1 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live on Render · v0.4.0 · MVP-3
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
          AI-Powered{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Cloud Security
          </span>
          <br />Operations Platform
        </h1>

        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Continuously discover, prioritize, and remediate security risks across{' '}
          <strong className="text-white">GitHub, AWS, and Jira</strong> from a single unified dashboard — powered by AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/login"
            className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-2 justify-center">
            Launch Platform
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 justify-center">
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 text-sm text-gray-500">
          {['Open Source', 'Demo Mode Available', 'Self-hostable', 'Render Deployed'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />{t}
            </span>
          ))}
        </div>
      </div>

      {/* Floating stat cards */}
      <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl w-full mx-auto">
        {[
          { value: '10+', label: 'Security Checks' },
          { value: '3', label: 'Compliance Frameworks' },
          { value: '∞', label: 'API Integrations' },
        ].map((s, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechStack() {
  return (
    <section className="py-16 border-y border-gray-800">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-gray-600 text-sm uppercase tracking-widest font-bold mb-8">Built with battle-tested technologies</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {STACK.map((t) => (
            <div key={t.name} className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition group">
              <div className="w-7 h-7 rounded text-xs font-black flex items-center justify-center text-white"
                style={{ backgroundColor: t.color + '33', color: t.color }}>
                {t.letter}
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white transition font-medium">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const problems = [
    { icon: AlertCircle, text: 'Security findings are scattered across AWS, GitHub, and Jira — with no unified view.' },
    { icon: Layers,      text: 'Alert fatigue kills team productivity; most teams prioritize the loudest — not the riskiest.' },
    { icon: Activity,    text: 'Remediation tracking lives in spreadsheets, Slack threads, and emails.' },
    { icon: ShieldCheck, text: 'Compliance audits are painful, manual, and happen too late.' },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Pill color="bg-red-500/10 text-red-400 border-red-500/20">The Problem</Pill>
            <h2 className="text-4xl font-black text-white mt-4">Security is broken across tools</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">Modern engineering teams use dozens of services. Security knowledge is buried in each one, creating blind spots that attackers exploit.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {problems.map(({ icon: Icon, text }, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="flex gap-4 p-5 bg-gray-800/40 border border-red-500/10 rounded-xl hover:border-red-500/20 transition">
                <div className="w-10 h-10 shrink-0 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-24 px-6 bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Pill color="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Features</Pill>
            <h2 className="text-4xl font-black text-white mt-4">Everything your security team needs</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">From vulnerability discovery to compliance reporting, Cortex covers the full security operations lifecycle.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="group p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Pill color="bg-violet-500/10 text-violet-400 border-violet-500/20">How It Works</Pill>
            <h2 className="text-4xl font-black text-white mt-4">From connection to compliance in minutes</h2>
          </div>
        </FadeIn>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[26px] top-12 bottom-12 w-px bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-500 hidden md:block" />
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20 z-10">
                    {s.num}
                  </div>
                  <div className="flex-1 bg-gray-800/50 border border-gray-700 group-hover:border-indigo-500/30 rounded-xl p-5 transition">
                    <h3 className="font-bold text-white mb-1">{s.title}</h3>
                    <p className="text-gray-400 text-sm">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  const nodes = [
    { label: 'GitHub', color: '#6e40c9', icon: '⬡' },
    { label: 'AWS', color: '#FF9900', icon: '⬡' },
    { label: 'Jira', color: '#0052CC', icon: '⬡' },
  ];
  return (
    <section className="py-24 px-6 bg-gray-900/50">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Pill color="bg-blue-500/10 text-blue-400 border-blue-500/20">Architecture</Pill>
            <h2 className="text-4xl font-black text-white mt-4">Built for the modern cloud stack</h2>
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 font-mono text-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-center">
              {/* Sources */}
              <div className="flex flex-col gap-3">
                {nodes.map(n => (
                  <div key={n.label} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 bg-gray-900">
                    <span className="text-lg" style={{ color: n.color }}>⬡</span>
                    <span className="text-gray-300 font-medium">{n.label}</span>
                  </div>
                ))}
              </div>
              {/* Arrow */}
              <div className="text-gray-600 text-2xl font-bold rotate-0 md:rotate-0 flex-shrink-0">──►</div>
              {/* Backend */}
              <div className="flex flex-col gap-2 text-center">
                <div className="px-6 py-3 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-300 font-bold">
                  <Server className="w-5 h-5 mx-auto mb-1" />
                  Cortex Backend<br/>
                  <span className="text-xs text-indigo-400 font-normal">FastAPI + Python</span>
                </div>
                <div className="text-gray-600 text-sm text-center">↕</div>
                <div className="px-4 py-2 bg-violet-600/20 border border-violet-500/30 rounded-lg text-violet-300 text-xs">
                  <Cpu className="w-4 h-4 mx-auto mb-1" />
                  AI Copilot (Groq)
                </div>
              </div>
              {/* Arrow */}
              <div className="text-gray-600 text-2xl font-bold flex-shrink-0">──►</div>
              {/* Frontend */}
              <div className="flex flex-col gap-2">
                {['Dashboard', 'Findings', 'Compliance', 'Reports'].map(p => (
                  <div key={p} className="px-4 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-medium">
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700 flex flex-wrap gap-4 justify-center text-xs text-gray-500">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> React SPA</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Firebase Auth</span>
              <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Firestore</span>
              <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> Docker / Render</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function APISection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Pill color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Developer API</Pill>
            <h2 className="text-4xl font-black text-white mt-4">Programmatic access to your security data</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">Every feature is exposed via a RESTful API. Authenticate with Bearer tokens or API Keys and integrate Cortex into any workflow.</p>
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-900/60 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/60"/><div className="w-3 h-3 rounded-full bg-yellow-500/60"/><div className="w-3 h-3 rounded-full bg-green-500/60"/></div>
              <span className="text-xs text-gray-500 ml-2 font-mono">REST API Reference</span>
            </div>
            <div className="divide-y divide-gray-700/50">
              {APIS.map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-700/20 transition font-mono text-sm">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded w-14 text-center ${METHOD_COLOR[a.method]}`}>{a.method}</span>
                  <span className="text-gray-300 flex-1">{a.path}</span>
                  <span className="text-gray-500 text-xs hidden md:block">{a.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function Roadmap() {
  const statusStyle = {
    done:     'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    progress: 'bg-blue-500/10   border-blue-500/30   text-blue-300',
    future:   'bg-gray-700/30   border-gray-600/30   text-gray-400',
  };
  const statusLabel = { done: '✅ Complete', progress: '🔄 In Progress', future: '🚀 Planned' };

  return (
    <section className="py-24 px-6 bg-gray-900/50">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Pill color="bg-amber-500/10 text-amber-400 border-amber-500/20">Roadmap</Pill>
            <h2 className="text-4xl font-black text-white mt-4">Our journey to an Autonomous Security OS</h2>
          </div>
        </FadeIn>
        <div className="space-y-4">
          {MILESTONES.map((m, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className={`flex gap-5 items-start p-5 border rounded-xl transition ${statusStyle[m.status]}`}>
                <div className="text-2xl">{statusLabel[m.status].split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-white">{m.version}</span>
                    <span className="text-sm font-semibold">{m.label}</span>
                    <span className="text-xs ml-auto opacity-70">{statusLabel[m.status].split(' ')[1]}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-70">{m.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Pill color="bg-pink-500/10 text-pink-400 border-pink-500/20">Team</Pill>
            <h2 className="text-4xl font-black text-white mt-4">Built by engineers, for engineers</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">AIXYNZ is building AI-native cybersecurity products that simplify modern security operations.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TEAM.map((t, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-7 hover:border-gray-600 transition-all duration-300">
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{t.name}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{t.role}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{t.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {t.focus.map(f => (
                    <span key={f} className="px-2 py-1 bg-gray-700/60 text-gray-300 text-xs rounded-md border border-gray-600/50">{f}</span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={300}>
          <div className="mt-8 text-center p-6 bg-gray-800/30 border border-gray-700 rounded-xl text-gray-400 text-sm">
            Built with ❤️ by <strong className="text-white">Atharva Sameer Gandhi</strong> and <strong className="text-white">Nayan Solanki</strong>. We welcome feedback, bug reports, feature requests, and contributions from the community.
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 px-6">
      <FadeIn>
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-900/60 to-violet-900/60 border border-indigo-500/20 rounded-3xl p-14">
          <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
          <h2 className="text-4xl font-black text-white mb-4">Secure your infrastructure today</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">Launch the platform in demo mode instantly — no credit card, no cloud credentials required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login"
              className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 justify-center">
              Launch for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition flex items-center gap-2 justify-center">
              <Github className="w-5 h-5" />
              Star on GitHub
            </a>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-800 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-black">AIXYNZ Cortex</div>
              <div className="text-gray-500 text-xs">v0.4.0 · MVP-3</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 font-semibold uppercase text-xs tracking-wider">Platform</span>
              <Link to="/login" className="text-gray-400 hover:text-white transition">Launch App</Link>
              <Link to="/login" className="text-gray-400 hover:text-white transition">API Keys</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 font-semibold uppercase text-xs tracking-wider">Resources</span>
              <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition">GitHub</a>
              <a href="https://github.com/asg492607/AIXYNZ-Cortex#readme" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition">Documentation</a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 font-semibold uppercase text-xs tracking-wider">Legal</span>
              <span className="text-gray-500 text-xs">MIT License</span>
              <span className="text-gray-500 text-xs">Open Source</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <span>© 2025 AIXYNZ · Atharva Sameer Gandhi & Nayan Solanki</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Navbar ──────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/95 backdrop-blur border-b border-gray-800 shadow-xl' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white">AIXYNZ<span className="text-indigo-400"> Cortex</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          {[['#features','Features'], ['#architecture','Architecture'], ['#api','API'], ['#team','Team']].map(([href, label]) => (
            <a key={href} href={href} className="hover:text-white transition">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition">
            <Github className="w-4 h-4" />GitHub
          </a>
          <Link to="/login"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-indigo-500/20">
            Launch App →
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Hero />
      <TechStack />
      <section id="features"><Problem /><Features /></section>
      <HowItWorks />
      <section id="architecture"><Architecture /></section>
      <section id="api"><APISection /></section>
      <Roadmap />
      <section id="team"><Team /></section>
      <CTA />
      <Footer />
    </div>
  );
}
