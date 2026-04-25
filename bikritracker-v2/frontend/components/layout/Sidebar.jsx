import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: '/inventory',
    label: 'Inventory',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 12v4m-2-2h4"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/predict',
    label: 'Predict',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

function getInitials(user) {
  if (user?.displayName) {
    return user.displayName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user?.email?.[0]?.toUpperCase() || 'U';
}

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  const initials  = getInitials(user);
  const storeName = user?.displayName || 'My Store';
  const email     = user?.email || '';

  return (
    <aside className="sidebar">

      {/* ── Logo ──────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="var(--primary-light)"/>
            <path d="M5 22l5-10 6 5 5-10 6 11" stroke="var(--primary)" strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">BikriTracker</span>
      </div>

      {/* ── Section label ─────────────────────────── */}
      <p className="sidebar-section-label">Menu</p>

      {/* ── Nav items ─────────────────────────────── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item${active ? ' active' : ''}`}
            >
              <span className="sidebar-nav-icon">{icon}</span>
              <span className="sidebar-nav-label">{label}</span>
              {active && <span className="sidebar-active-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Spacer ────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Help card ─────────────────────────────── */}
      <div className="sidebar-help-card">
        <div className="sidebar-help-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.8"/>
            <path d="M12 16v-4m0-4h.01" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="sidebar-help-title">Need help?</p>
          <p className="sidebar-help-sub">Add 30+ history rows for best predictions.</p>
        </div>
      </div>

      {/* ── User + logout ─────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" aria-label={storeName}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{storeName}</p>
            <p className="sidebar-user-email">{email}</p>
          </div>
        </div>
        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M16 17l5-5-5-5M21 12H9"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </aside>
  );
}