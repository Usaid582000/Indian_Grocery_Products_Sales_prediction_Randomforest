import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function Layout({ children, title }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bikri-dark-mode') === 'true';
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('bikri-dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-inner">
          <div className="page-loading-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width="32" height="32">
              <rect width="32" height="32" rx="8" fill="var(--primary-light)"/>
              <path d="M5 22l5-10 6 5 5-10 6 11" stroke="var(--primary)" strokeWidth="2.8"
                strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hideShell = router.pathname === '/dashboard' || router.pathname === '/inventory' || router.pathname === '/predict' || router.pathname === '/account';

  return (
    <div className={`app-shell ${darkMode ? 'dark-theme' : ''}`}>
      <Head>
        <title>{title && title != "Dashboard" ? `${title} - BikriTracker` : 'BikriTracker'}</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={darkMode ? "#111827" : "#1f1d3c"} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      {!hideShell && <Sidebar />}
      <div className="app-main" style={hideShell ? { padding: 0 } : {}}>
        {!hideShell && <TopBar title={title} />}
        <main className="app-content" style={hideShell ? { padding: 0, maxWidth: '100%', margin: 0 } : {}}>
          {children}
        </main>
      </div>
      <BottomNav onAccountClick={() => setIsAccountOpen(true)} />

      {/* Account Drawer Panel */}
      <div className={`account-drawer-overlay ${isAccountOpen ? 'open' : ''}`} onClick={() => setIsAccountOpen(false)}>
        <div className="account-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <div className="profile-large">
              <img src={user?.photoURL || "https://i.pravatar.cc/150?u=a042581f4e29026024d"} alt="avatar" />
              <div className="profile-status">Online</div>
            </div>
            <h2 className="drawer-name" style={{ color: 'white' }}>{user?.displayName || 'Alex User'}</h2>
            <p className="drawer-email" style={{ color: 'white', opacity: 0.8 }}>{user?.email}</p>
          </div>

          <div className="drawer-content">
            <div className="drawer-group">
              <h4 className="group-title">Preferences</h4>
              <div className="drawer-item" onClick={() => setDarkMode(!darkMode)}>
                <div className="item-icon">{darkMode ? '🌙' : '☀️'}</div>
                <div className="item-text">
                  <span className="item-label">Dark Mode</span>
                  <span className="item-sub">{darkMode ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="toggle-switch">
                  <div className={`toggle-knob ${darkMode ? 'on' : ''}`} />
                </div>
              </div>
              <div className="drawer-item">
                <div className="item-icon">🎨</div>
                <div className="item-text">
                  <span className="item-label">Change Theme</span>
                  <span className="item-sub">Default (Coming Soon)</span>
                </div>
              </div>
            </div>

            <div className="drawer-group">
              <h4 className="group-title">Account Details</h4>
              <div className="drawer-item" onClick={() => { setIsAccountOpen(false); router.push('/account'); }}>
                <div className="item-icon">👤</div>
                <div className="item-text">
                  <span className="item-label">Personal Info</span>
                  <span className="item-sub">Name, Gender, Phone, etc.</span>
                </div>
              </div>
              <div className="drawer-item" onClick={() => { setIsAccountOpen(false); router.push('/account?action=password'); }}>
                <div className="item-icon">🔑</div>
                <div className="item-text">
                  <span className="item-label">Change Password</span>
                  <span className="item-sub">Update security credentials</span>
                </div>
              </div>
            </div>
          </div>

          <div className="drawer-footer">
            <button className="logout-btn" onClick={() => logout()}>
              <span className="logout-icon">🔓</span>
              Sign Out
            </button>
            <p className="version-tag">BikriTracker v2.4.0</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .account-drawer-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
          z-index: 100000; opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .account-drawer-overlay.open { opacity: 1; pointer-events: auto; }

        .account-drawer {
          position: absolute; top: 0; left: 0; bottom: 0;
          width: 320px; background: white;
          box-shadow: 20px 0 50px rgba(0,0,0,0.1);
          transform: translateX(-100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column;
          font-family: 'Outfit', sans-serif;
        }
        .account-drawer-overlay.open .account-drawer { transform: translateX(0); }

        .drawer-header {
          padding: 60px 30px 30px;
          background: linear-gradient(135deg, #1f1d3c 0%, #28254c 100%);
          color: white; text-align: center;
        }
        .profile-large {
          position: relative; width: 90px; height: 90px; margin: 0 auto 16px;
        }
        .profile-large img {
          width: 100%; height: 100%; border-radius: 50%; border: 3px solid rgba(255,255,255,0.2);
          object-fit: cover;
        }
        .profile-status {
          position: absolute; bottom: 4px; right: 4px;
          background: #22c55e; color: white; font-size: 8px; font-weight: 800;
          padding: 2px 6px; border-radius: 10px; border: 2px solid #1f1d3c;
          text-transform: uppercase;
        }
        .drawer-name { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
        .drawer-email { font-size: 13px; opacity: 0.6; font-weight: 500; margin: 0; }

        .drawer-content { flex: 1; padding: 30px; overflow-y: auto; }
        .drawer-group { margin-bottom: 30px; }
        .group-title {
          font-size: 11px; font-weight: 800; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;
        }
        .drawer-item {
          display: flex; align-items: center; gap: 16px; padding: 12px 0;
          cursor: pointer; transition: transform 0.2s;
        }
        .drawer-item:active { transform: translateX(5px); }
        .item-icon {
          width: 40px; height: 40px; background: #f8fafc; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .item-text { display: flex; flex-direction: column; }
        .item-label { font-size: 15px; font-weight: 700; color: #1e1b4b; }
        .item-sub { font-size: 12px; color: #94a3b8; font-weight: 500; }

        .drawer-footer { padding: 30px; border-top: 1px solid #f1f5f9; }
        .logout-btn {
          width: 100%; height: 56px; background: #fee2e2; color: #ef4444;
          border: none; border-radius: 18px; font-size: 15px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer; transition: all 0.2s;
        }
        .logout-btn:active { transform: scale(0.98); background: #fecaca; }
        .version-tag { text-align: center; font-size: 11px; color: #cbd5e1; margin-top: 16px; font-weight: 600; }

        .toggle-switch {
          margin-left: auto; width: 44px; height: 24px; background: #e2e8f0;
          border-radius: 12px; position: relative; transition: background 0.3s;
        }
        .toggle-knob {
          position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
          background: white; border-radius: 50%; transition: left 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toggle-knob.on { left: 22px; }
        .drawer-item:has(.toggle-knob.on) .toggle-switch { background: #6366f1; }

        /* Dark Theme Styles */
        .app-shell.dark-theme {
          background-color: #0f172a; color: #f8fafc;
        }
        .app-shell.dark-theme :global(body) { background-color: #0f172a !important; }
        
        /* Drawer Dark Styles */
        .app-shell.dark-theme .account-drawer { background-color: #1e293b; color: #f8fafc; }
        .app-shell.dark-theme .item-label { color: #f1f5f9; }
        .app-shell.dark-theme .item-icon { background: #334155; }
        .app-shell.dark-theme .group-title { color: #94a3b8; }
        .app-shell.dark-theme .drawer-footer { border-top-color: #334155; }
        .app-shell.dark-theme .logout-btn { background: rgba(239, 68, 68, 0.1); color: #f87171; }
        .app-shell.dark-theme .toggle-switch { background: #475569; }

        /* Global UI Dark Styles */
        .app-shell.dark-theme :global(.m-card), 
        .app-shell.dark-theme :global(.v-modal) { 
          background-color: #1e293b !important; 
          color: #f8fafc !important; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
        }
        .app-shell.dark-theme :global(.new-dash),
        .app-shell.dark-theme :global(.new-inv),
        .app-shell.dark-theme :global(.new-predict),
        .app-shell.dark-theme :global(#account-page-override) {
          background-color: #0f172a !important;
        }
        .app-shell.dark-theme :global(.card-title),
        .app-shell.dark-theme :global(.section-title),
        .app-shell.dark-theme :global(.h-label),
        .app-shell.dark-theme :global(.stat-label),
        .app-shell.dark-theme :global(.item-sub) {
          color: #94a3b8 !important;
        }
        .app-shell.dark-theme :global(.card-val),
        .app-shell.dark-theme :global(.h-name),
        .app-shell.dark-theme :global(.h-val),
        .app-shell.dark-theme :global(.item-title),
        .app-shell.dark-theme :global(.v-label) {
          color: #f8fafc !important;
        }
        .app-shell.dark-theme :global(input),
        .app-shell.dark-theme :global(select),
        .app-shell.dark-theme :global(.v-input),
        .app-shell.dark-theme :global(.v-select) {
          background-color: #334155 !important;
          border-color: #475569 !important;
          color: white !important;
        }
        .app-shell.dark-theme :global(.list-item),
        .app-shell.dark-theme :global(.history-item),
        .app-shell.dark-theme :global(.pl-item) {
          border-bottom-color: #334155 !important;
        }
        .app-shell.dark-theme :global(.divider) {
          background-color: #334155 !important;
        }
        .app-shell.dark-theme :global(.v-primary-btn) {
          background-color: #6366f1 !important;
        }
        .app-shell.dark-theme :global(.v-modal-backdrop) {
          background: rgba(0,0,0,0.8) !important;
        }
      `}</style>
    </div>
  );
}