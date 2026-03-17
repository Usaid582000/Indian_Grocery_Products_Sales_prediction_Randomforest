import Layout from '../components/layout/Layout';

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <div className="page-placeholder">
        <div className="placeholder-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="1.8"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="1.8"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="1.8"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="1.8"/>
          </svg>
        </div>
        <h2>Dashboard</h2>
        <p>Step 9 will add stats, charts, and insights here.</p>
        <div className="badge badge-orange">Coming in Step 9</div>
      </div>
    </Layout>
  );
}