import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';

const FIREBASE_ERRORS = {
  'auth/user-not-found':     'No account found with this email.',
  'auth/wrong-password':     'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email':      'Please enter a valid email address.',
  'auth/too-many-requests':  'Too many attempts. Please wait a moment.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

function parseFirebaseError(code) {
  return FIREBASE_ERRORS[code] || 'Something went wrong. Please try again.';
}

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // redirect if already logged in
  if (!authLoading && user) {
    router.replace('/');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(parseFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Head>
        <title>Log In - BikriTracker</title>
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

          <h1>Sell smarter,<br />not harder.</h1>
          <p>
            AI-powered sales predictions built for grocery
            store owners. Know what to stock before you run out.
          </p>

          <div className="auth-brand-features">
            {[
              'Predict sales up to 3 months ahead',
              'Voice & QR input for quick entry',
              'Real-time sync across all devices',
              'Track prediction accuracy over time',
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
            <h2>Welcome back</h2>
            <p>Log in to your store account</p>
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
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Password</label>
                <div className="input-password-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <><span className="spinner spinner-sm spinner-white" /> Loging in...</>
                ) : (
                  'Log in'
                )}
              </button>

            </div>
          </form>

          <div className="auth-form-footer">
            Don&apos;t have an account?{' '}
            <Link href="/signup">Create one free</Link>
          </div>

        </div>
      </div>
    </div>
  );
}