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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width="32" height="32">
              <rect width="32" height="32" rx="8" fill="#fff7ed"/>
              <path d="M5 22l5-10 6 5 5-10 6 11" stroke="#f97316" strokeWidth="2.8"
                strokeLinecap="round" strokeLinejoin="round" fill="none"/>
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