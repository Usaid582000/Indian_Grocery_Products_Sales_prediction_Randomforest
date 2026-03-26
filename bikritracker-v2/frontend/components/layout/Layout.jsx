import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import Head from 'next/head';

export default function Layout({ children, title }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-inner">
          <div className="page-loading-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4-8 5 4 4-8" stroke="var(--primary)" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-shell">
      <Head>
        <title>{title && title != "Dashboard" ? `${title} - BikriTracker` : 'BikriTracker'}</title>
      </Head>
      <Sidebar />
      <div className="app-main">
        <TopBar title={title} />
        <main className="app-content">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}