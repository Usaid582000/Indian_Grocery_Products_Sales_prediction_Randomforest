import Layout from '../components/layout/Layout';

export default function Predict() {
  return (
    <Layout title="Predict Sales">
      <div className="page-placeholder">
        <div className="placeholder-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"
              stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2>Predict Sales</h2>
        <p>Step 8 will add AI-powered sales predictions with charts and history here.</p>
        <div className="badge badge-orange">Coming in Step 8</div>
      </div>
    </Layout>
  );
}