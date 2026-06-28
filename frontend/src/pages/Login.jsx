import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Firebase error → human-friendly message ── */
function friendlyError(code) {
  const map = {
    'auth/user-not-found':      'No account found with this email address.',
    'auth/wrong-password':      'Incorrect password. Please try again.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/invalid-credential':  'Invalid email or password.',
    'auth/too-many-requests':   'Too many failed attempts. Please try again later.',
    'auth/user-disabled':       'This account has been disabled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user':'Google sign-in was cancelled.',
    'auth/popup-blocked':       'Pop-up blocked by browser. Please allow pop-ups for this site.',
  };
  return map[code] || 'Sign-in failed. Please try again.';
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { login, loginWithGoogle, loginWithGithub, loginWithMicrosoft, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setInfo('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGithub = async () => {
    setError(''); setInfo('');
    setLoading(true);
    try {
      await loginWithGithub();
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoft = async () => {
    setError(''); setInfo('');
    setLoading(true);
    try {
      await loginWithMicrosoft();
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      await resetPassword(resetEmail);
      setInfo(`Password reset email sent to ${resetEmail}. Check your inbox.`);
      setShowReset(false);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); * { box-sizing: border-box; } input { font-family: inherit; }`}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', boxShadow: '0 20px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>🛡️</div>
                <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>
                  <span style={{ color: '#0f172a' }}>AIXYNZ</span>
                  <span style={{ color: '#6366f1' }}> Cortex</span>
                </span>
              </div>
            </Link>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              {showReset ? 'Reset your password' : 'Welcome back'}
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              {showReset
                ? "We'll send a reset link to your email"
                : <>No account? <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Create one free →</Link></>
              }
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: 14, color: '#dc2626', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ flexShrink: 0 }}>⚠️</span> {error}
            </div>
          )}
          {info && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: 14, color: '#15803d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ flexShrink: 0 }}>✅</span> {info}
            </div>
          )}

          {/* Reset password form */}
          {showReset ? (
            <form onSubmit={handleReset}>
              <label style={labelStyle}>Email address</label>
              <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} autoFocus />
              <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: 8 }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => { setShowReset(false); setError(''); }}
                style={{ ...btnGhost, marginTop: 10 }}>
                ← Back to sign in
              </button>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={handleGoogle} disabled={loading} style={btnOAuth}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  {loading ? 'Signing in…' : 'Continue with Google'}
                </button>
                <button onClick={handleMicrosoft} disabled={loading} style={btnOAuth}>
                  <svg width="18" height="18" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                  {loading ? 'Signing in…' : 'Continue with Microsoft'}
                </button>
                <button onClick={handleGithub} disabled={loading} style={btnOAuth}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#24292f" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.16c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.01 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  {loading ? 'Signing in…' : 'Continue with GitHub'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>or sign in with email</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              {/* Email/password form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" style={inputStyle} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle}>Password</label>
                    <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setError(''); }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, cursor: 'pointer', fontWeight: 500, padding: 0 }}>
                      Forgot password?
                    </button>
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} style={btnPrimary}>
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
              </form>

              {/* Demo mode hint */}
              <div style={{ marginTop: 20, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                🎮 <strong style={{ color: '#0f172a' }}>Demo Mode:</strong> Just click <strong>Sign in</strong> with any email — real auth is live via Firebase.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
          By signing in you agree to our terms. · <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Shared styles ── */
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
  fontSize: 14, color: '#0f172a', outline: 'none', background: '#f8fafc', transition: 'border-color 0.2s',
  display: 'block',
};

const btnPrimary = {
  width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontWeight: 700, fontSize: 15, color: '#fff',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  boxShadow: '0 4px 16px rgba(99,102,241,0.35)', transition: 'all 0.2s',
  fontFamily: 'inherit',
};

const btnOAuth = {
  width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
  background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontFamily: 'inherit',
};

const btnGhost = {
  width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0',
  background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b',
  transition: 'all 0.2s', fontFamily: 'inherit',
};
