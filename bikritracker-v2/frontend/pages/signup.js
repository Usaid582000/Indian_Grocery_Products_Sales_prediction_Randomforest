import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';

const FIREBASE_ERRORS = {
  'auth/email-already-in-use':   'An account with this email already exists.',
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/weak-password':          'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

function parseFirebaseError(code) {
  return FIREBASE_ERRORS[code] || 'Something went wrong. Please try again.';
}

export default function Signup() {
  const { signup, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [storeName, setStoreName] = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  if (!authLoading && user) {
    router.replace('/dashboard');
    return null;
  }

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!storeName.trim()) { setError('Store name is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await signup(email.trim(), password, storeName.trim());
      router.replace('/dashboard');
    } catch (err) {
      setError(parseFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <Head>
        <title>Create Account — BikriTracker</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="10" fill="rgba(255,255,255,0.15)"/>
              <path d="M5 22l5-10 6 5 5-10 6 11" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="logo-text">BikriTracker</span>
        </div>

        <div className="auth-header">
          <h1>Create account 🚀</h1>
          <p>Set up your store in seconds</p>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Store name */}
          <div className="field-group">
            <label>Store name</label>
            <div className="input-wrap">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
              </svg>
              <input
                type="text"
                placeholder="e.g. Sharma General Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Email */}
          <div className="field-group">
            <label>Email address</label>
            <div className="input-wrap">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8a1 1 0 011-1h16a1 1 0 011 1"/>
              </svg>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="field-group">
            <label>Password</label>
            <div className="input-wrap">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Strength bar */}
            {password && (
              <div className="strength-bar-wrap">
                <div className="strength-bars">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="strength-bar" style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="field-group">
            <label>Confirm password</label>
            <div className="input-wrap">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 7l-8 8-4-4"/>
              </svg>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className={confirm && confirm !== password ? 'input-error' : ''}
              />
            </div>
            {confirm && confirm !== password && (
              <span className="mismatch-hint">Passwords don&apos;t match</span>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading || !storeName || !email || !password || !confirm}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Creating account...
              </span>
            ) : 'Create Account →'}
          </button>
        </form>

        <p className="switch-link">
          Already have an account?{' '}
          <Link href="/login">Log in</Link>
        </p>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0e1f; }
      `}</style>
      <style jsx>{`
        .auth-shell {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0e1f 0%, #1a183a 50%, #0f1628 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Outfit', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .blob {
          position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.25; pointer-events: none;
        }
        .blob-1 { width: 400px; height: 400px; background: radial-gradient(circle, #6366f1, transparent); top: -100px; left: -100px; }
        .blob-2 { width: 350px; height: 350px; background: radial-gradient(circle, #8b5cf6, transparent); bottom: -80px; right: -80px; }

        .auth-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 36px 32px;
          width: 100%; max-width: 420px;
          position: relative; z-index: 1;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
        }

        .auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .logo-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }
        .logo-icon svg { width: 28px; height: 28px; }
        .logo-text { font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.5px; }

        .auth-header { margin-bottom: 24px; }
        .auth-header h1 { font-size: 26px; font-weight: 800; color: white; margin-bottom: 6px; letter-spacing: -0.5px; }
        .auth-header p { font-size: 15px; color: rgba(255, 255, 255, 0.5); font-weight: 500; }

        .error-banner {
          display: flex; align-items: center; gap: 10px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171; padding: 12px 16px; border-radius: 14px;
          font-size: 13px; font-weight: 600; margin-bottom: 20px;
        }

        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .field-group { display: flex; flex-direction: column; gap: 7px; }
        .field-group label {
          font-size: 12px; font-weight: 700;
          color: rgba(255, 255, 255, 0.55);
          text-transform: uppercase; letter-spacing: 0.5px; padding-left: 4px;
        }

        .input-wrap { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 16px; color: rgba(255,255,255,0.3); pointer-events: none; z-index: 1; }
        .input-wrap input {
          width: 100%; height: 54px;
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px; padding: 0 50px 0 48px;
          font-size: 15px; font-family: 'Outfit', sans-serif; font-weight: 600;
          color: white; outline: none; transition: all 0.2s;
        }
        .input-wrap input::placeholder { color: rgba(255, 255, 255, 0.2); font-weight: 400; }
        .input-wrap input:focus {
          border-color: rgba(99, 102, 241, 0.7);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }
        .input-wrap input.input-error { border-color: rgba(239, 68, 68, 0.5); }
        .mismatch-hint { font-size: 12px; color: #f87171; font-weight: 600; padding-left: 4px; }

        .eye-btn {
          position: absolute; right: 14px;
          background: none; border: none;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer; padding: 6px; border-radius: 8px;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .eye-btn:hover { color: rgba(255, 255, 255, 0.7); }

        .strength-bar-wrap { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
        .strength-bars { display: flex; gap: 4px; flex: 1; }
        .strength-bar { flex: 1; height: 4px; border-radius: 2px; transition: background 0.3s; }

        .submit-btn {
          width: 100%; height: 58px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white; border: none; border-radius: 20px;
          font-size: 16px; font-weight: 800; font-family: 'Outfit', sans-serif;
          cursor: pointer; margin-top: 6px; transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4); letter-spacing: 0.3px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5); }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white;
          border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .switch-link {
          text-align: center; margin-top: 22px;
          font-size: 14px; color: rgba(255,255,255,0.4); font-weight: 500;
        }
        .switch-link :global(a) { color: #818cf8; font-weight: 700; text-decoration: none; }
        .switch-link :global(a:hover) { color: #a5b4fc; }

        @media (max-width: 480px) {
          .auth-card { padding: 28px 20px; border-radius: 26px; }
          .auth-header h1 { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}