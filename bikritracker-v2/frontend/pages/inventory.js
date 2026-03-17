import Layout from '../components/layout/Layout';

export default function Inventory() {
  return (
    <Layout title="Inventory">
      <div className="page-placeholder">
        <div className="placeholder-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"
              stroke="var(--primary)" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
              stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M12 12v4m-2-2h4"
              stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <h2>Inventory</h2>
        <p>Step 4 will add product management, QR scanning, and voice input here.</p>
        <div className="badge badge-orange">Coming in Step 4</div>
      </div>
    </Layout>
  );
}