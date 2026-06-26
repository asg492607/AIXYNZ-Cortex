import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────
   Inline styles so we're 100% dependency-free
   and it renders identically in prod build
───────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
    overflowX: 'hidden',
  },
};

/* ── Animated counter ───────────────────────────────────── */
function Counter({ end, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let start = 0;
      const step = () => {
        start += Math.ceil(end / 40);
        if (start >= end) { setVal(end); return; }
        setVal(start);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.disconnect();
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Fade-in on scroll ─────────────────────────────────── */
function FadeUp({ children, delay = 0, style = {} }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(32px)',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.3s',
      background: scrolled ? 'rgba(5,8,22,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      padding: '0 2rem',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 0 20px rgba(99,102,241,0.4)'
          }}>🛡️</div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#fff' }}>AIXYNZ</span>
            <span style={{ color: '#818cf8' }}> Cortex</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14 }}>
          {[['#features','Features'],['#how','How it Works'],['#api','API'],['#team','Team']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='#94a3b8'}>
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer"
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor='rgba(255,255,255,0.25)'; e.target.style.color='#fff'; }}
            onMouseLeave={e => { e.target.style.borderColor='rgba(255,255,255,0.12)'; e.target.style.color='#94a3b8'; }}>
            GitHub ↗
          </a>
          <Link to="/login" style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', color: '#fff',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
            Launch App →
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 2rem 80px', textAlign: 'center', overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'pulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'pulse 4s ease-in-out infinite 2s' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 60%)' }} />
      </div>
      {/* Grid overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
        {/* Live badge */}
        <FadeUp>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', marginBottom: 28, fontSize: 13, color: '#818cf8', fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Live · v0.4.0 · MVP-3 Complete
          </div>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={100}>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', margin: '0 0 24px', color: '#fff' }}>
            AI-Powered{' '}
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Cloud Security
            </span>
            <br />Operations Platform
          </h1>
        </FadeUp>

        {/* Sub */}
        <FadeUp delay={200}>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#94a3b8', maxWidth: 680, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Continuously discover, prioritize, and remediate security risks across{' '}
            <strong style={{ color: '#e2e8f0' }}>GitHub, AWS, and Jira</strong> from a single unified dashboard — powered by AI.
          </p>
        </FadeUp>

        {/* CTAs */}
        <FadeUp delay={300}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#fff',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)', transition: 'all 0.3s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(99,102,241,0.4)'; }}>
              🚀 Launch Platform Free
            </Link>
            <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer" style={{
              padding: '14px 32px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none',
              color: '#e2e8f0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}>
              ⭐ Star on GitHub
            </a>
          </div>
        </FadeUp>

        {/* Trust row */}
        <FadeUp delay={400}>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', marginTop: 36, fontSize: 13, color: '#64748b' }}>
            {['✅ Demo Mode — No credentials needed', '✅ Open Source (MIT)', '✅ Self-hostable', '✅ Deployed on Render'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </FadeUp>
      </div>

      {/* Stat cards */}
      <FadeUp delay={500} style={{ marginTop: 64, width: '100%', maxWidth: 700, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { val: 10, suffix: '+', label: 'Security Checks' },
            { val: 3, suffix: '', label: 'Compliance Frameworks' },
            { val: 6, suffix: '+', label: 'Integrations' },
            { val: 100, suffix: '%', label: 'Tests Passing' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px 12px', textAlign: 'center', backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#818cf8', letterSpacing: '-1px' }}>
                <Counter end={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

/* ── Trusted Stack ───────────────────────────────────────── */
const STACK = ['React', 'FastAPI', 'Firebase', 'Docker', 'AWS SDK', 'PyGitHub', 'Groq AI', 'Render'];
function TrustedStack() {
  return (
    <section style={{ padding: '32px 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#475569', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20 }}>Built with battle-tested technologies</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {STACK.map(name => (
            <div key={name} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)', fontSize: 13, fontWeight: 600, color: '#94a3b8',
              cursor: 'default', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(129,140,248,0.4)'; e.currentTarget.style.color='#818cf8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#94a3b8'; }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Problem / Solution ─────────────────────────────────── */
function ProblemSolution() {
  const problems = [
    { icon: '🔍', title: 'Scattered Findings', desc: 'Security data is spread across AWS Console, GitHub, Jira, and email. No single source of truth.' },
    { icon: '🚨', title: 'Alert Fatigue', desc: 'Too many low-quality alerts kill team productivity. Critical risks hide in the noise.' },
    { icon: '📊', title: 'Manual Compliance', desc: 'Compliance audits are painful, manual, and happen too late to prevent incidents.' },
    { icon: '🐢', title: 'Slow Remediation', desc: 'No clear ownership or tracking for security fixes. Things fall through the cracks.' },
  ];
  return (
    <section style={{ padding: '100px 2rem', maxWidth: 1100, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>The Problem</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 16px' }}>Security is broken across tools</h2>
          <p style={{ color: '#64748b', fontSize: 17, maxWidth: 580, margin: '0 auto' }}>Modern engineering teams use dozens of services. Security knowledge is buried in each one, creating blind spots attackers exploit.</p>
        </div>
      </FadeUp>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {problems.map((p, i) => (
          <FadeUp key={i} delay={i * 80}>
            <div style={{
              padding: '28px 24px', borderRadius: 16, border: '1px solid rgba(239,68,68,0.12)',
              background: 'rgba(239,68,68,0.03)', transition: 'all 0.3s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(239,68,68,0.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(239,68,68,0.12)'}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
              <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 8, fontSize: 16 }}>{p.title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* ── Features Grid ───────────────────────────────────────── */
const FEATURES = [
  { emoji: '☁️',  color: ['#f97316','#fb923c'], title: 'AWS Security Scanner',     desc: 'Continuously scan IAM, S3, EC2, and RDS for misconfigurations and critical vulnerabilities.' },
  { emoji: '🐙',  color: ['#6e40c9','#8b5cf6'], title: 'GitHub Scanner',            desc: 'Detect exposed secrets, dependency CVEs, and code security issues across all repos.' },
  { emoji: '🤖',  color: ['#6366f1','#818cf8'], title: 'AI Security Copilot',       desc: 'Groq LLM-powered analysis generates step-by-step remediation guidance for every finding.' },
  { emoji: '🕸️',  color: ['#ec4899','#f43f5e'], title: 'Attack Graph',              desc: 'Visualize blast radius and lateral movement paths. Understand what an attacker can reach.' },
  { emoji: '🗃️',  color: ['#06b6d4','#0ea5e9'], title: 'Asset Inventory',           desc: 'Unified inventory of cloud and code assets with per-asset aggregate risk scores.' },
  { emoji: '✅',  color: ['#10b981','#059669'], title: 'Compliance Mapping',        desc: 'Auto-mapping to SOC 2, ISO 27001, and CIS Benchmarks with detailed drill-down views.' },
  { emoji: '⚡',  color: ['#eab308','#f59e0b'], title: 'Workflow Automation',       desc: 'Define condition-based triggers (e.g. Severity=Critical) to route alerts via Slack.' },
  { emoji: '🔑',  color: ['#8b5cf6','#7c3aed'], title: 'Public API & Keys',         desc: 'SHA-256 hashed API keys for CI/CD pipelines, with full CRUD management UI.' },
  { emoji: '📊',  color: ['#14b8a6','#0d9488'], title: 'Reporting & Audit Logs',    desc: 'Export findings as CSV or JSON. Maintain a full immutable audit trail per org.' },
  { emoji: '👥',  color: ['#f43f5e','#e11d48'], title: 'Multi-tenancy & RBAC',      desc: 'Fully isolated org boundaries with admin, analyst, and viewer role enforcement.' },
];

function Features() {
  return (
    <section id="features" style={{ padding: '100px 2rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>Features</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 16px' }}>Everything your security team needs</h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 560, margin: '0 auto' }}>From vulnerability discovery to compliance reporting, Cortex covers the full security operations lifecycle.</p>
          </div>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <FadeUp key={i} delay={i * 50}>
              <div style={{
                padding: '28px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='rgba(129,140,248,0.25)'; e.currentTarget.style.background='rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, marginBottom: 16,
                  background: `linear-gradient(135deg, ${f.color[0]}, ${f.color[1]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  boxShadow: `0 8px 24px ${f.color[0]}33`,
                }}>{f.emoji}</div>
                <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 8, fontSize: 16 }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ────────────────────────────────────────── */
const STEPS = [
  { num: '01', icon: '🔗', title: 'Connect Your Tools',   desc: 'Link GitHub, AWS, and Jira from the Integrations dashboard. Cortex handles auth and rate limiting.' },
  { num: '02', icon: '🔍', title: 'Continuous Scanning',  desc: 'Cortex runs automated scans across all connected platforms, deduplicating findings and computing risk scores.' },
  { num: '03', icon: '🤖', title: 'AI Analysis',          desc: 'The AI Copilot explains every finding in plain English and generates step-by-step remediation guidance.' },
  { num: '04', icon: '🎯', title: 'Prioritize Risks',     desc: 'Attack Graph visualization shows blast radius. Focus on findings with the highest real-world impact first.' },
  { num: '05', icon: '📋', title: 'Track Remediation',    desc: 'Create Jira tickets, assign owners, set SLAs, and track fix progress directly inside Cortex.' },
  { num: '06', icon: '📊', title: 'Report & Comply',      desc: 'Generate compliance reports for SOC 2, ISO 27001, and CIS. Export findings for external auditors.' },
];
function HowItWorks() {
  return (
    <section id="how" style={{ padding: '100px 2rem', maxWidth: 900, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>How It Works</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 16px' }}>From connection to compliance in minutes</h2>
        </div>
      </FadeUp>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 27, top: 56, bottom: 56, width: 2, background: 'linear-gradient(to bottom, #6366f1, #a78bfa, #7c3aed)', opacity: 0.3 }} />
        {STEPS.map((s, i) => (
          <FadeUp key={i} delay={i * 80}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, zIndex: 1, boxShadow: '0 0 24px rgba(99,102,241,0.3)',
              }}>{s.icon}</div>
              <div style={{
                flex: 1, padding: '20px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'; e.currentTarget.style.background='rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', letterSpacing: '1px' }}>{s.num}</span>
                  <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16, margin: 0 }}>{s.title}</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* ── Architecture ────────────────────────────────────────── */
function Architecture() {
  return (
    <section style={{ padding: '100px 2rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', fontSize: 12, fontWeight: 700, color: '#22d3ee', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>Architecture</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Single-service, unified deployment</h2>
          </div>
        </FadeUp>
        <FadeUp delay={150}>
          <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '48px 40px', fontFamily: 'monospace' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto auto', alignItems: 'center', justifyContent: 'center', gap: '12px 8px', textAlign: 'center' }}>
              {/* Source column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['☁️ AWS','#f97316'],['🐙 GitHub','#8b5cf6'],['📋 Jira','#3b82f6']].map(([label, color]) => (
                  <div key={label} style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${color}44`, background: `${color}11`, color, fontWeight: 700, fontSize: 13 }}>{label}</div>
                ))}
              </div>
              <div style={{ fontSize: 24, color: '#334155', fontWeight: 300 }}>──►</div>
              {/* Backend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ padding: '16px 24px', borderRadius: 14, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>
                  🛡️ Cortex Backend<br/>
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#6366f1', opacity: 0.8 }}>FastAPI · Python 3.11</span>
                </div>
                <div style={{ fontSize: 12, color: '#334155' }}>↕ Firestore DB</div>
                <div style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.07)', color: '#a78bfa', fontSize: 13, fontWeight: 700 }}>
                  🤖 AI Copilot (Groq)
                </div>
              </div>
              <div style={{ fontSize: 24, color: '#334155', fontWeight: 300 }}>──►</div>
              {/* Frontend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['📊 Dashboard','#10b981'],['🔍 Findings','#f43f5e'],['✅ Compliance','#06b6d4'],['📈 Reports','#8b5cf6']].map(([label, color]) => (
                  <div key={label} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${color}33`, background: `${color}0d`, color, fontSize: 12, fontWeight: 600 }}>{label}</div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 32, paddingTop: 20, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12, color: '#475569' }}>
              {['⚛️ React SPA', '🔒 Firebase Auth', '🗄️ Firestore', '🐳 Docker', '☁️ Render Free Tier'].map(t => <span key={t}>{t}</span>)}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── API Section ─────────────────────────────────────────── */
const APIS = [
  { m: 'GET',  path: '/api/v1/findings',           desc: 'List all findings with severity/status filters' },
  { m: 'POST', path: '/api/v1/scan/rescan',         desc: 'Trigger a fresh security scan across all connectors' },
  { m: 'POST', path: '/api/v1/copilot/chat',        desc: 'Chat with the AI Security Copilot' },
  { m: 'GET',  path: '/api/v1/assets',              desc: 'Asset inventory with per-asset risk scores' },
  { m: 'GET',  path: '/api/v1/graph/blast-radius/{id}', desc: 'Compute attack graph blast radius for an asset' },
  { m: 'GET',  path: '/api/v1/reports/compliance/{fw}', desc: 'Compliance posture by framework (SOC2, ISO27001)' },
  { m: 'POST', path: '/api/v1/workflows',           desc: 'Create an automation workflow rule' },
  { m: 'POST', path: '/api/v1/api-keys',            desc: 'Generate a new API key (stored as SHA-256 hash)' },
  { m: 'GET',  path: '/api/v1/audit-logs',          desc: 'Retrieve the full org audit trail' },
];
const MC = { GET: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' }, POST: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' }, DELETE: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' } };

function APISection() {
  return (
    <section id="api" style={{ padding: '100px 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 12, fontWeight: 700, color: '#34d399', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>Developer API</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 16px' }}>Programmatic access to your security data</h2>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 580, margin: '0 auto' }}>Authenticate with Firebase Bearer tokens or our SHA-256 hashed API Keys. Every feature available via REST.</p>
        </div>
      </FadeUp>
      <FadeUp delay={150}>
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 13, color: '#475569' }}>
            <div style={{ display: 'flex', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', opacity: 0.6 }}/><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', opacity: 0.6 }}/><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', opacity: 0.6 }}/></div>
            <span style={{ marginLeft: 8 }}>REST API · Base URL: https://aixynz-cortex.onrender.com</span>
          </div>
          {APIS.map((a, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '70px 1fr 1fr', alignItems: 'center', gap: 16,
              padding: '14px 20px', borderBottom: i < APIS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              fontFamily: 'monospace', fontSize: 13, transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, textAlign: 'center', background: MC[a.m].bg, color: MC[a.m].color }}>{a.m}</span>
              <span style={{ color: '#e2e8f0' }}>{a.path}</span>
              <span style={{ color: '#475569', fontSize: 12 }}>{a.desc}</span>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

/* ── Roadmap ─────────────────────────────────────────────── */
const MILESTONES = [
  { v: 'MVP-1', title: 'Security Command Center',      status: 'done',     desc: 'Core scanning, findings pipeline, dashboard, RBAC, Slack & Jira integrations.' },
  { v: 'MVP-2', title: 'Security Operations Platform', status: 'done',     desc: 'AI Copilot, Asset Inventory, Webhooks, Audit Logs, Finding Suppression.' },
  { v: 'MVP-3', title: 'AI Security Platform',         status: 'done',     desc: 'Attack Graph, Compliance V2, Workflow Automation, API Keys, Production Deploy.' },
  { v: 'MVP-4', title: 'Enterprise & Scale',           status: 'progress', desc: 'SSO, fine-grained permissions, SLA tracking, multi-region support.' },
  { v: 'MVP-5', title: 'Autonomous Security OS',       status: 'future',   desc: 'Self-healing posture, predictive risk modeling, autonomous remediation.' },
];
function Roadmap() {
  const sty = {
    done:     { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', badge: '#34d399', badgeBg: 'rgba(16,185,129,0.12)', label: '✅ Complete' },
    progress: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.25)', badge: '#818cf8', badgeBg: 'rgba(99,102,241,0.12)', label: '🔄 In Progress' },
    future:   { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', badge: '#475569', badgeBg: 'rgba(255,255,255,0.04)', label: '🚀 Planned' },
  };
  return (
    <section style={{ padding: '100px 2rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>Roadmap</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Towards an Autonomous Security OS</h2>
          </div>
        </FadeUp>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {MILESTONES.map((m, i) => {
            const s = sty[m.status];
            return (
              <FadeUp key={i} delay={i * 80}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '20px 24px', borderRadius: 14, border: `1px solid ${s.border}`, background: s.bg, transition: 'all 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                  <div style={{ padding: '4px 10px', borderRadius: 8, background: s.badgeBg, color: s.badge, fontWeight: 800, fontSize: 12, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>{m.v}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{m.title}</span>
                      <span style={{ fontSize: 11, color: s.badge, marginLeft: 'auto' }}>{s.label}</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0', lineHeight: 1.6 }}>{m.desc}</p>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Team ────────────────────────────────────────────────── */
const TEAM = [
  {
    name: 'Atharva Sameer Gandhi', role: 'Founder · AI & Security Engineer',
    bio: 'Leads architecture and development of AIXYNZ Cortex. Focused on AI-powered cybersecurity, backend systems, cloud security, and product engineering.',
    tags: ['AI & LLM Applications', 'Cybersecurity', 'Backend Engineering', 'Cloud & DevSecOps', 'System Design'],
    avatar: 'AG', grad: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  {
    name: 'Nayan Solanki', role: 'Co-Founder · Full-Stack & Platform Engineer',
    bio: 'Responsible for frontend development, platform integration, user experience, and transforming complex security workflows into intuitive interfaces.',
    tags: ['Full-Stack Development', 'React & Frontend', 'Product Engineering', 'API Integration', 'User Experience'],
    avatar: 'NS', grad: 'linear-gradient(135deg, #10b981, #059669)',
  },
];
function Team() {
  return (
    <section id="team" style={{ padding: '100px 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>Team</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 12px' }}>Built by engineers, for engineers</h2>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>AIXYNZ is building AI-native cybersecurity products that simplify modern security operations through automation and intelligent analysis.</p>
        </div>
      </FadeUp>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {TEAM.map((t, i) => (
          <FadeUp key={i} delay={i * 150}>
            <div style={{
              padding: '32px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'; e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18, background: t.grad, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                }}>{t.avatar}</div>
                <div>
                  <h3 style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 17, margin: 0 }}>{t.name}</h3>
                  <p style={{ color: '#6366f1', fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>{t.role}</p>
                </div>
              </div>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{t.bio}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {t.tags.map(tag => (
                  <span key={tag} style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={300}>
        <div style={{ marginTop: 24, padding: '20px 28px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: '#475569', fontSize: 14 }}>
          Built with ❤️ by <strong style={{ color: '#e2e8f0' }}>Atharva Sameer Gandhi</strong> and <strong style={{ color: '#e2e8f0' }}>Nayan Solanki</strong>. We welcome feedback, bug reports, feature requests, and contributions.
        </div>
      </FadeUp>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{ padding: '80px 2rem 120px' }}>
      <FadeUp>
        <div style={{
          maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '80px 48px',
          borderRadius: 28, position: 'relative', overflow: 'hidden',
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.05) 60%, transparent 100%)',
        }}>
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🛡️</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 16px' }}>Secure your infrastructure today</h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>Launch Cortex in demo mode instantly — no cloud credentials, no credit card required.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" style={{
                padding: '16px 36px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#fff',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 40px rgba(99,102,241,0.45)', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 50px rgba(99,102,241,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 40px rgba(99,102,241,0.45)'; }}>
                🚀 Launch for Free
              </Link>
              <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer" style={{
                padding: '16px 36px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none',
                color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}>
                ⭐ Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 2rem 40px', background: 'rgba(0,0,0,0.3)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div>
              <span style={{ fontWeight: 900, fontSize: 17 }}><span style={{ color: '#fff' }}>AIXYNZ</span><span style={{ color: '#818cf8' }}> Cortex</span></span>
            </div>
            <p style={{ color: '#334155', fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>AI-Powered Cloud Security Operations Platform. Open source. Self-hostable. Production ready.</p>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {[
              { title: 'Platform', links: [['Launch App', '/login'],['Dashboard', '/dashboard'],['API Keys', '/login']] },
              { title: 'Resources', links: [['GitHub', 'https://github.com/asg492607/AIXYNZ-Cortex'],['Documentation', 'https://github.com/asg492607/AIXYNZ-Cortex#readme'],['Report Bug', 'https://github.com/asg492607/AIXYNZ-Cortex/issues']] },
              { title: 'Legal', links: [['MIT License','#'],['Open Source','#'],['Privacy Policy','#']] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#334155', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>{title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(([label, href]) => (
                    href.startsWith('/') ? (
                      <Link key={label} to={href} style={{ color: '#475569', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color='#94a3b8'} onMouseLeave={e => e.target.style.color='#475569'}>{label}</Link>
                    ) : (
                      <a key={label} href={href} target="_blank" rel="noreferrer" style={{ color: '#475569', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color='#94a3b8'} onMouseLeave={e => e.target.style.color='#475569'}>{label}</a>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: '#1e293b', fontSize: 13 }}>© 2025 AIXYNZ · Atharva Sameer Gandhi & Nayan Solanki · MIT License</span>
          <span style={{ color: '#1e293b', fontSize: 13 }}>v0.4.0 · MVP-3 Complete</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: #050816; } 
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>
      <Navbar />
      <Hero />
      <TrustedStack />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <Architecture />
      <APISection />
      <Roadmap />
      <Team />
      <CTA />
      <Footer />
    </div>
  );
}
