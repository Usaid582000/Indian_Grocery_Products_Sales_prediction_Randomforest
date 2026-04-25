import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email':        'Please enter a valid email address.',
  'auth/weak-password':        'Password must be at least 6 characters.',
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
    router.replace('/');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!storeName.trim()) { setError('Store name is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await signup(email.trim(), password, storeName.trim());
      router.replace('/');
    } catch (err) {
      setError(parseFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    return s; // 0-3
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][strength];

  return (
    <div className="auth-page">
      <Head>
        <title>Create Account - BikriTracker</title>
      </Head>

      {/* Left brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-content">

          <div className="auth-brand-logo">
            <div className="auth-brand-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                <rect width="32" height="32" rx="8" fill="var(--primary-light)"/>
                <path d="M5 22l5-10 6 5 5-10 6 11" stroke="var(--primary)" strokeWidth="2.8"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="auth-brand-name">BikriTracker</span>
          </div>

          <h1>Start predicting,<br />start growing.</h1>
          <p>
            Join grocery store owners who use BikriTracker to
            make smarter inventory decisions with AI.
          </p>

          <div className="auth-brand-features">
            {[
              'Free to get started — no credit card',
              'Set up in under 5 minutes',
              'Import products via QR or voice',
              'Predictions powered by your own data',
            ].map((f) => (
              <div className="auth-brand-feature" key={f}>
                <div className="auth-brand-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">

          {/* mobile-only logo */}
          <div className="auth-page-mobile-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill="var(--primary-light)"/>
              <path d="M5 22l5-10 6 5 5-10 6 11" stroke="var(--primary)" strokeWidth="2.8"
                strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span>BikriTracker</span>
          </div>

          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Set up your store in seconds</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-body">

              {error && (
                <div className="alert alert-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,marginTop:1}}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="label">Store name</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Sharma General Store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Email address</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8a1 1 0 011-1h16a1 1 0 011 1"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Password</label>
                <div className="input-password-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-password-toggle"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* password strength bar */}
                {password && (
                  <div style={{marginTop: 8}}>
                    <div style={{display:'flex', gap: 4, marginBottom: 4}}>
                      {[1,2,3].map((i) => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= strength ? strengthColor : 'var(--border)',
                          transition: 'background 0.3s',
                        }}/>
                      ))}
                    </div>
                    <span style={{fontSize:11, color: strengthColor, fontWeight: 600}}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label">Confirm password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input ${confirm && confirm !== password ? 'error' : ''}`}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {confirm && confirm !== password && (
                  <span style={{fontSize:12, color:'var(--error)', marginTop:4}}>
                    Passwords don&apos;t match
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={loading || !storeName || !email || !password || !confirm}
              >
                {loading ? (
                  <><span className="spinner spinner-sm spinner-white" /> Creating account...</>
                ) : (
                  'Create account'
                )}
              </button>

            </div>
          </form>

          <div className="auth-form-footer">
            Already have an account?{' '}
            <Link href="/login">Log in</Link>
          </div>

        </div>
      </div>
    </div>
  );
}