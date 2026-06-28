import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Theme-aware CSS variables injected dynamically ─────── */
const LIGHT_CSS = `
  :root {
    --bg-page:      #f8fafc;
    --bg-section:   #f1f5f9;
    --bg-card:      #ffffff;
    --bg-card-hover:#f8faff;
    --border:       rgba(0,0,0,0.07);
    --border-hover: rgba(99,102,241,0.35);
    --text-primary: #0f172a;
    --text-secondary:#475569;
    --text-muted:   #94a3b8;
    --text-faint:   #cbd5e1;
    --accent:       #6366f1;
    --accent-light: #eef2ff;
    --accent-glow:  rgba(99,102,241,0.15);
    --nav-bg:       rgba(248,250,252,0.95);
    --hero-orb1:    rgba(99,102,241,0.08);
    --hero-orb2:    rgba(139,92,246,0.06);
    --grid-line:    rgba(99,102,241,1);
    --code-bg:      #f1f5f9;
    --code-border:  rgba(0,0,0,0.06);
    --footer-bg:    #f1f5f9;
    --scrollbar-thumb: #cbd5e1;
    --shadow-card:  0 2px 16px rgba(0,0,0,0.06);
  }
`;
const DARK_CSS = `
  :root {
    --bg-page:      #050816;
    --bg-section:   rgba(255,255,255,0.01);
    --bg-card:      rgba(255,255,255,0.02);
    --bg-card-hover:rgba(99,102,241,0.05);
    --border:       rgba(255,255,255,0.07);
    --border-hover: rgba(99,102,241,0.3);
    --text-primary: #f1f5f9;
    --text-secondary:#94a3b8;
    --text-muted:   #64748b;
    --text-faint:   #334155;
    --accent:       #818cf8;
    --accent-light: rgba(99,102,241,0.12);
    --accent-glow:  rgba(99,102,241,0.2);
    --nav-bg:       rgba(5,8,22,0.95);
    --hero-orb1:    rgba(99,102,241,0.15);
    --hero-orb2:    rgba(139,92,246,0.12);
    --grid-line:    rgba(99,102,241,1);
    --code-bg:      rgba(0,0,0,0.3);
    --code-border:  rgba(255,255,255,0.06);
    --footer-bg:    rgba(0,0,0,0.3);
    --scrollbar-thumb: #1e293b;
    --shadow-card:  none;
  }
`;

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes pulse-anim { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg-page); color: var(--text-primary); transition: background 0.4s, color 0.4s; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-page); }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
`;

/* ── Helpers ─────────────────────────────────────────────── */
function FadeUp({ children, delay = 0 }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(28px)',
    }}>{children}</div>
  );
}

function Counter({ end, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let n = 0;
      const tick = () => { n += Math.ceil(end / 40); if (n >= end) { setVal(end); return; } setVal(n); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      obs.disconnect();
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Navbar ─────────────────────────────────────────────── */
function Navbar({ dark, toggle }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 2rem',
      background: scrolled ? 'var(--nav-bg)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      transition: 'all 0.3s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 20px rgba(99,102,241,0.35)', flexShrink: 0 }}>🛡️</div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--text-primary)' }}>AIXYNZ</span>
            <span style={{ color: '#6366f1' }}> Cortex</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14 }}>
          {[['#features','Features'],['#how','How it Works'],['#api','API'],['#team','Team']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color='var(--accent)'}
              onMouseLeave={e => e.target.style.color='var(--text-secondary)'}>
              {label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme toggle */}
          <button onClick={toggle} title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
            {dark ? '☀️' : '🌙'}
          </button>

          <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: 'var(--bg-card)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
            ⭐ GitHub
          </a>
          <Link to="/login" style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', color: '#fff',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.2s',
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
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, var(--hero-orb1) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse-anim 5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, var(--hero-orb2) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse-anim 5s ease-in-out infinite 2s' }} />
      </div>
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, var(--accent) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 920 }}>
        <FadeUp>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, border: '1px solid rgba(99,102,241,0.3)', background: 'var(--accent-light)', marginBottom: 28, fontSize: 13, color: '#6366f1', fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-anim 2s infinite' }} />
            Live on Render · v0.4.0 · MVP-3 Complete
          </div>
        </FadeUp>

        <FadeUp delay={100}>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5.2rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2.5px', margin: '0 0 24px', color: 'var(--text-primary)' }}>
            AI-Powered{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Cloud Security
            </span>
            <br />Operations Platform
          </h1>
        </FadeUp>

        <FadeUp delay={200}>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.75 }}>
            Continuously discover, prioritize, and remediate security risks across{' '}
            <strong style={{ color: 'var(--text-primary)' }}>GitHub, AWS, and Jira</strong> from a single unified dashboard — powered by AI.
          </p>
        </FadeUp>

        <FadeUp delay={300}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#fff',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 8px 30px rgba(99,102,241,0.4)', transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 40px rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(99,102,241,0.4)'; }}>
              🚀 Launch Platform Free
            </Link>
            <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer" style={{
              padding: '14px 32px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none',
              color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)', transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-primary)'; }}>
              ⭐ View on GitHub
            </a>
          </div>
        </FadeUp>

        <FadeUp delay={400}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            {['✅ No credentials needed', '✅ Open Source (MIT)', '✅ Self-hostable', '✅ Render Deployed'].map(t => <span key={t}>{t}</span>)}
          </div>
        </FadeUp>
      </div>

      {/* Stat cards */}
      <FadeUp delay={500}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 680, width: '100%', margin: '64px auto 0', position: 'relative', zIndex: 1 }}>
          {[
            { val: 10, suffix: '+', label: 'Security Checks' },
            { val: 3, suffix: '', label: 'Compliance Frameworks' },
            { val: 6, suffix: '+', label: 'Integrations' },
            { val: 100, suffix: '%', label: 'Tests Passing' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '20px 12px', textAlign: 'center',
              boxShadow: 'var(--shadow-card)', transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.4)'; e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#6366f1', letterSpacing: '-1px' }}>
                <Counter end={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

/* ── Tech Stack ──────────────────────────────────────────── */
const STACK = ['React 18', 'FastAPI', 'Firebase', 'Docker', 'AWS SDK', 'PyGitHub', 'Groq AI', 'Render'];
function TrustedStack() {
  return (
    <section style={{ padding: '32px 2rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 18 }}>Built with battle-tested technologies</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {STACK.map(name => (
            <div key={name} style={{
              padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-card)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-card)', cursor: 'default', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.5)'; e.currentTarget.style.color='#6366f1'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.transform='translateY(0)'; }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Problem ─────────────────────────────────────────────── */
const PROBLEMS = [
  { icon: '🔍', title: 'Scattered Findings',    desc: 'Security data is spread across AWS Console, GitHub, Jira, and email — no single source of truth.' },
  { icon: '🚨', title: 'Alert Fatigue',         desc: 'Too many low-quality alerts kill team productivity. Critical risks get buried in the noise.' },
  { icon: '📊', title: 'Manual Compliance',     desc: 'Compliance audits are painful, manual, and always happen too late to prevent real incidents.' },
  { icon: '🐢', title: 'Slow Remediation',      desc: 'No clear ownership or tracking for fixes. Security issues fall through the cracks for months.' },
];
function Problem() {
  return (
    <section style={{ padding: '100px 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, fontWeight: 800, color: '#ef4444', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase' }}>The Problem</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: '0 0 14px' }}>Security is broken across tools</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Modern engineering teams use dozens of services. Security knowledge is buried in each one, creating blind spots attackers exploit.</p>
          </div>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          {PROBLEMS.map((p, i) => (
            <FadeUp key={p.title} delay={i * 80}>
              <div style={{
                padding: '28px 24px', borderRadius: 16, border: '1px solid rgba(239,68,68,0.12)',
                background: 'rgba(239,68,68,0.03)', transition: 'all 0.3s', boxShadow: 'var(--shadow-card)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; e.currentTarget.style.transform='translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.12)'; e.currentTarget.style.transform='translateY(0)'; }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{p.icon}</div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontSize: 16 }}>{p.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ────────────────────────────────────────────── */
const FEATURES = [
  { emoji:'☁️',  grad:['#f97316','#fb923c'], title:'AWS Security Scanner',    desc:'Continuously scan IAM, S3, EC2, and RDS for misconfigurations and critical vulnerabilities.' },
  { emoji:'🐙',  grad:['#6e40c9','#8b5cf6'], title:'GitHub Scanner',           desc:'Detect exposed secrets, dependency CVEs, and code security issues across all repositories.' },
  { emoji:'🤖',  grad:['#6366f1','#818cf8'], title:'AI Security Copilot',      desc:'Groq LLM-powered analysis generates step-by-step remediation guidance for every finding.' },
  { emoji:'🕸️',  grad:['#ec4899','#f43f5e'], title:'Attack Graph',             desc:'Visualize blast radius and lateral movement paths. See what an attacker can reach.' },
  { emoji:'🗃️',  grad:['#06b6d4','#0ea5e9'], title:'Asset Inventory',          desc:'Unified inventory of cloud and code assets with per-asset aggregate risk scores.' },
  { emoji:'✅',  grad:['#10b981','#059669'], title:'Compliance Mapping',       desc:'Auto-mapping to SOC 2, ISO 27001, and CIS benchmarks with detailed drill-down views.' },
  { emoji:'⚡',  grad:['#eab308','#f59e0b'], title:'Workflow Automation',      desc:'Define condition-based triggers (Severity=Critical) to route alerts via Slack or email.' },
  { emoji:'🔑',  grad:['#8b5cf6','#7c3aed'], title:'Public API & Keys',        desc:'SHA-256 hashed API keys for CI/CD pipelines, with full CRUD management UI.' },
  { emoji:'📊',  grad:['#14b8a6','#0d9488'], title:'Reporting & Audit Logs',   desc:'Export findings as CSV or JSON. Maintain a full immutable audit trail per org.' },
  { emoji:'👥',  grad:['#f43f5e','#e11d48'], title:'Multi-tenancy & RBAC',     desc:'Fully isolated org boundaries with admin, analyst, and viewer role enforcement.' },
];
function Features() {
  return (
    <section id="features" style={{ padding: '100px 2rem', background: 'var(--bg-section)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'var(--accent-light)', border: '1px solid rgba(99,102,241,0.25)', fontSize: 11, fontWeight: 800, color: '#6366f1', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Features</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: '0 0 14px' }}>Everything your security team needs</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>From vulnerability discovery to compliance reporting — Cortex covers the full security operations lifecycle.</p>
          </div>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={i * 45}>
              <div style={{
                padding: '28px 24px', borderRadius: 16, border: '1px solid var(--border)',
                background: 'var(--bg-card)', transition: 'all 0.3s', cursor: 'default',
                boxShadow: 'var(--shadow-card)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.borderColor='rgba(99,102,241,0.4)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(99,102,241,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='var(--shadow-card)'; }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg,${f.grad[0]},${f.grad[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16, boxShadow: `0 6px 20px ${f.grad[0]}33` }}>{f.emoji}</div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontSize: 16 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
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
  { n:'01', icon:'🔗', title:'Connect Your Tools',   desc:'Link GitHub, AWS, and Jira from the Integrations dashboard. Cortex handles auth and rate limiting.' },
  { n:'02', icon:'🔍', title:'Continuous Scanning',  desc:'Cortex runs automated scans across all connected platforms, deduplicates findings, and computes risk scores.' },
  { n:'03', icon:'🤖', title:'AI Analysis',          desc:'The AI Copilot explains every finding in plain English and generates step-by-step remediation guidance.' },
  { n:'04', icon:'🎯', title:'Prioritize Risks',     desc:'Attack Graph shows blast radius. Focus on findings with the highest real-world impact first.' },
  { n:'05', icon:'📋', title:'Track Remediation',    desc:'Create Jira tickets, assign owners, set SLAs, and track fix progress directly inside Cortex.' },
  { n:'06', icon:'📊', title:'Report & Comply',      desc:'Generate compliance reports for SOC 2, ISO 27001, and CIS. Export findings for external auditors.' },
];
function HowItWorks() {
  return (
    <section id="how" style={{ padding: '100px 2rem', maxWidth: 880, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', fontSize: 11, fontWeight: 800, color: '#8b5cf6', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase' }}>How It Works</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: 0 }}>From connection to compliance in minutes</h2>
        </div>
      </FadeUp>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 27, top: 56, bottom: 56, width: 2, background: 'linear-gradient(to bottom, #6366f1, #a78bfa)', opacity: 0.25 }} />
        {STEPS.map((s, i) => (
          <FadeUp key={s.n} delay={i * 70}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, zIndex: 1, boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>{s.icon}</div>
              <div style={{ flex: 1, padding: '18px 22px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.35)'; e.currentTarget.style.transform='translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateX(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', letterSpacing: '1px' }}>{s.n}</span>
                  <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, margin: 0 }}>{s.title}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
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
    <section style={{ padding: '100px 2rem', background: 'var(--bg-section)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', fontSize: 11, fontWeight: 800, color: '#0891b2', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Architecture</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: 0 }}>Single-service, unified deployment</h2>
          </div>
        </FadeUp>
        <FadeUp delay={120}>
          <div style={{ borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '44px 36px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['☁️ AWS','#f97316'],['🐙 GitHub','#7c3aed'],['📋 Jira','#2563eb']].map(([l,c]) => (
                  <div key={l} style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${c}33`, background: `${c}0d`, color: c, fontWeight: 700, fontSize: 13, textAlign: 'center' }}>{l}</div>
                ))}
              </div>
              <div style={{ fontSize: 22, color: 'var(--text-faint)' }}>──►</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <div style={{ padding: '18px 26px', borderRadius: 14, border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.06)', color: '#6366f1', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>
                  🛡️ Cortex Backend<br/>
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>FastAPI · Python 3.11</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>↕ Firestore DB</div>
                <div style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.06)', color: '#8b5cf6', fontSize: 13, fontWeight: 700 }}>🤖 AI Copilot (Groq)</div>
              </div>
              <div style={{ fontSize: 22, color: 'var(--text-faint)' }}>──►</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['📊 Dashboard','#10b981'],['🔍 Findings','#ef4444'],['✅ Compliance','#0891b2'],['📈 Reports','#8b5cf6']].map(([l,c]) => (
                  <div key={l} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${c}33`, background: `${c}0d`, color: c, fontSize: 12, fontWeight: 600 }}>{l}</div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 32, paddingTop: 18, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
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
  { m:'GET',  p:'/api/v1/findings',                d:'List findings with severity/status filters' },
  { m:'POST', p:'/api/v1/scan/rescan',             d:'Trigger a fresh scan across all connectors' },
  { m:'POST', p:'/api/v1/copilot/chat',            d:'Chat with the AI Security Copilot' },
  { m:'GET',  p:'/api/v1/assets',                  d:'Asset inventory with per-asset risk scores' },
  { m:'GET',  p:'/api/v1/graph/blast-radius/{id}', d:'Compute attack graph blast radius' },
  { m:'GET',  p:'/api/v1/reports/compliance/{fw}', d:'Compliance posture by framework' },
  { m:'POST', p:'/api/v1/workflows',               d:'Create an automation workflow rule' },
  { m:'POST', p:'/api/v1/api-keys',               d:'Generate a new API key (SHA-256 hashed)' },
];
const MC = { GET:{bg:'rgba(16,185,129,0.1)',c:'#059669'}, POST:{bg:'rgba(99,102,241,0.1)',c:'#6366f1'}, DELETE:{bg:'rgba(239,68,68,0.1)',c:'#dc2626'} };
function APISection() {
  return (
    <section id="api" style={{ padding: '100px 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, fontWeight: 800, color: '#059669', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Developer API</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: '0 0 14px' }}>Programmatic access to your security data</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>Authenticate with Bearer tokens or SHA-256 hashed API Keys. Every feature is accessible via REST.</p>
        </div>
      </FadeUp>
      <FadeUp delay={120}>
        <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '12px 20px', background: 'var(--code-bg)', borderBottom: '1px solid var(--code-border)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', gap: 5 }}>{['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.7 }}/>)}</div>
            <span style={{ marginLeft: 8 }}>REST API · aixynz-cortex · v1</span>
          </div>
          {APIS.map((a, i) => (
            <div key={a.p} style={{
              display: 'grid', gridTemplateColumns: '68px 1fr', alignItems: 'center', gap: 16,
              padding: '13px 20px', borderBottom: i < APIS.length - 1 ? '1px solid var(--border)' : 'none',
              fontFamily: 'monospace', fontSize: 13, background: 'var(--bg-card)', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-section)'}
              onMouseLeave={e => e.currentTarget.style.background='var(--bg-card)'}>
              <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, textAlign: 'center', background: MC[a.m].bg, color: MC[a.m].c }}>{a.m}</span>
              <div>
                <span style={{ color: 'var(--text-primary)', display: 'block' }}>{a.p}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.d}</span>
              </div>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

/* ── Roadmap ─────────────────────────────────────────────── */
const MILESTONES = [
  { v:'MVP-1', title:'Security Command Center',      status:'done',     desc:'Core scanning, findings pipeline, dashboard, RBAC, Slack & Jira integrations.' },
  { v:'MVP-2', title:'Security Operations Platform', status:'done',     desc:'AI Copilot, Asset Inventory, Webhooks, Audit Logs, Finding Suppression.' },
  { v:'MVP-3', title:'AI Security Platform',         status:'done',     desc:'Attack Graph, Compliance V2, Workflow Automation, API Keys, Production Deploy.' },
  { v:'MVP-4', title:'Enterprise & Scale',           status:'progress', desc:'SSO, fine-grained permissions, SLA tracking, multi-region support.' },
  { v:'MVP-5', title:'Autonomous Security OS',       status:'future',   desc:'Self-healing posture, predictive risk modeling, autonomous remediation.' },
];
function Roadmap() {
  const S = {
    done:     { bg:'rgba(16,185,129,0.06)', border:'rgba(16,185,129,0.2)',  c:'#059669', label:'✅ Complete',     badgeBg:'rgba(16,185,129,0.1)' },
    progress: { bg:'rgba(99,102,241,0.06)', border:'rgba(99,102,241,0.25)', c:'#6366f1', label:'🔄 In Progress',  badgeBg:'rgba(99,102,241,0.1)' },
    future:   { bg:'var(--bg-card)',        border:'var(--border)',          c:'var(--text-muted)', label:'🚀 Planned', badgeBg:'var(--bg-section)' },
  };
  return (
    <section style={{ padding: '100px 2rem', background: 'var(--bg-section)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', fontSize: 11, fontWeight: 800, color: '#d97706', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Roadmap</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: 0 }}>Towards an Autonomous Security OS</h2>
          </div>
        </FadeUp>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MILESTONES.map((m, i) => {
            const s = S[m.status];
            return (
              <FadeUp key={m.v} delay={i * 70}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 22px', borderRadius: 14, border: `1px solid ${s.border}`, background: s.bg, boxShadow: 'var(--shadow-card)', transition: 'all 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateX(5px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                  <div style={{ padding: '4px 10px', borderRadius: 8, background: s.badgeBg, color: s.c, fontWeight: 800, fontSize: 12, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>{m.v}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{m.title}</span>
                      <span style={{ fontSize: 11, color: s.c, marginLeft: 'auto', fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0', lineHeight: 1.6 }}>{m.desc}</p>
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
  { name:'Atharva Sameer Gandhi', role:'Founder · AI & Security Engineer', bio:'Leads architecture and development of AIXYNZ Cortex. Focused on AI-powered cybersecurity, backend systems, cloud security, and product engineering.', tags:['AI & LLM Applications','Cybersecurity','Backend Engineering','Cloud & DevSecOps','System Design','Product Engineering','Frontend Development'], av:'AG', grad:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { name:'Nayan Solanki', role:'Co-Founder · Full-Stack & Platform Engineer', bio:'Responsible for frontend development, platform integration, user experience, and transforming security workflows into intuitive interfaces.', tags:['Full-Stack Development','Cybersecurity','React & Frontend','Frontend Development','Product Engineering','API Integration','User Experience'], av:'NS', grad:'linear-gradient(135deg,#10b981,#059669)' },
];
function Team() {
  return (
    <section id="team" style={{ padding: '100px 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 11, fontWeight: 800, color: '#e11d48', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Team</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: '0 0 14px' }}>Built by engineers, for engineers</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>AIXYNZ is building AI-native cybersecurity products that simplify modern security operations through automation and intelligent analysis.</p>
        </div>
      </FadeUp>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 22 }}>
        {TEAM.map((t, i) => (
          <FadeUp key={t.name} delay={i * 120}>
            <div style={{ padding: '32px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.35)'; e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow-card)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: t.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', boxShadow: '0 8px 24px rgba(99,102,241,0.25)', flexShrink: 0 }}>{t.av}</div>
                <div>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 17, margin: 0 }}>{t.name}</h3>
                  <p style={{ color: '#6366f1', fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>{t.role}</p>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>{t.bio}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {t.tags.map(tag => (
                  <span key={tag} style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--bg-section)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={250}>
        <div style={{ marginTop: 22, padding: '18px 28px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Built with ❤️ by <strong style={{ color: 'var(--text-primary)' }}>Atharva Sameer Gandhi</strong> and <strong style={{ color: 'var(--text-primary)' }}>Nayan Solanki</strong>. We welcome feedback, bug reports, feature requests, and contributions.
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
          maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '72px 48px',
          borderRadius: 24, border: '1px solid rgba(99,102,241,0.2)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
          boxShadow: '0 20px 80px rgba(99,102,241,0.08)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🛡️</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: '0 0 14px' }}>Secure your infrastructure today</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>Launch in demo mode instantly — no cloud credentials, no credit card required.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ padding: '15px 36px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 48px rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(99,102,241,0.4)'; }}>
              🚀 Launch for Free
            </Link>
            <a href="https://github.com/asg492607/AIXYNZ-Cortex" target="_blank" rel="noreferrer"
              style={{ padding: '15px 36px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none', color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.4)'; e.currentTarget.style.color='#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-primary)'; }}>
              ⭐ Star on GitHub
            </a>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 2rem 40px', background: 'var(--footer-bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div>
              <span style={{ fontWeight: 900, fontSize: 16 }}><span style={{ color: 'var(--text-primary)' }}>AIXYNZ</span><span style={{ color: '#6366f1' }}> Cortex</span></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 260, lineHeight: 1.6 }}>AI-Powered Cloud Security Operations Platform. Open source. Self-hostable. Production ready.</p>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {[
              { title: 'Platform', links: [['Launch App','/login'],['Dashboard','/dashboard'],['API Keys','/login']] },
              { title: 'Resources', links: [['GitHub','https://github.com/asg492607/AIXYNZ-Cortex'],['Documentation','https://github.com/asg492607/AIXYNZ-Cortex#readme'],['Report Bug','https://github.com/asg492607/AIXYNZ-Cortex/issues']] },
              { title: 'Legal', links: [['MIT License','#'],['Open Source','#'],['Privacy','#']] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>{title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(([label, href]) =>
                    href.startsWith('/') ? (
                      <Link key={label} to={href} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color='#6366f1'} onMouseLeave={e => e.target.style.color='var(--text-muted)'}>{label}</Link>
                    ) : (
                      <a key={label} href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color='#6366f1'} onMouseLeave={e => e.target.style.color='var(--text-muted)'}>{label}</a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>© 2025 AIXYNZ · Atharva Sameer Gandhi & Nayan Solanki · MIT License</span>
          <span>v0.4.0 · MVP-3 Complete</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Root ────────────────────────────────────────────────── */
export default function Landing() {
  const [dark, setDark] = useState(false);

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem('cortex_theme');
    if (saved === 'dark') setDark(true);
  }, []);

  const toggle = () => {
    setDark(d => {
      const next = !d;
      localStorage.setItem('cortex_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <>
      {/* Inject CSS variables */}
      <style>{dark ? DARK_CSS : LIGHT_CSS}{GLOBAL_CSS}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)', transition: 'background 0.4s, color 0.4s' }}>
        <Navbar dark={dark} toggle={toggle} />
        <Hero />
        <TrustedStack />
        <Problem />
        <Features />
        <HowItWorks />
        <Architecture />
        <APISection />
        <Roadmap />
        <Team />
        <CTA />
        <Footer />
      </div>
    </>
  );
}
