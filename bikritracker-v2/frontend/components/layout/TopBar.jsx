import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/predict':   'Predict Sales',
};

function getInitials(user) {
  if (user?.displayName) {
    return user.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }
  return user?.email?.[0]?.toUpperCase() || 'U';
}

export default function TopBar({ title }) {
  const { user, logout } = useAuth();
  const router           = useRouter();
  const [open, setOpen]  = useState(false);
  const menuRef          = useRef(null);

  const pageTitle = title || PAGE_TITLES[router.pathname] || 'BikriTracker';
  const initials  = getInitials(user);
  const today     = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  // close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace('/login');
  }

  return (
    <header className="topbar">

      {/* Left side */}
      <div className="topbar-left">
        {/* Mobile-only logo mark */}
        <div className="topbar-mobile-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill="var(--primary-light)"/>
              <path d="M5 22l5-10 6 5 5-10 6 11" stroke="var(--primary)" strokeWidth="2.8"
                strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="topbar-right">
        <span className="topbar-date">{today}</span>

        {/* Avatar + dropdown */}
        <div className="topbar-user-wrap" ref={menuRef}>
          <button
            className="topbar-avatar"
            onClick={() => setOpen((o) => !o)}
            aria-label="User menu"
            aria-expanded={open}
          >
            {initials}
          </button>

          {open && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <p className="topbar-dropdown-name">
                  {user?.displayName || 'My Store'}
                </p>
                <p className="topbar-dropdown-email">{user?.email}</p>
              </div>
              <div className="topbar-dropdown-divider" />
              <button className="topbar-dropdown-item" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}