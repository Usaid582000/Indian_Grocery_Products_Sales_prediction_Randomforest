import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { useProducts } from '../lib/hooks/useProducts';
import { usePredictions } from '../lib/hooks/usePredictions';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { products,    loading: pLoading } = useProducts();
  const { predictions, loading: predLoading, avgAccuracy } = usePredictions();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Step 3 verification strip */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Step 3 — Firestore hooks live
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>

            <StatCard
              label="Products"
              value={pLoading ? '…' : products.length}
              sub="in Firestore"
              color="var(--primary)"
            />

            <StatCard
              label="Predictions"
              value={predLoading ? '…' : predictions.length}
              sub="saved"
              color="#8b5cf6"
            />

            <StatCard
              label="Avg accuracy"
              value={predLoading ? '…' : (avgAccuracy !== null ? `${avgAccuracy}%` : 'n/a')}
              sub="where actuals set"
              color="#10b981"
            />

            <StatCard
              label="Real-time"
              value="ON"
              sub="Firestore onSnapshot"
              color="#f59e0b"
            />

          </div>
        </div>

        {/* Products list preview */}
        {!pLoading && products.length > 0 && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <h3 style={{ marginBottom: 12 }}>Recent products (live)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {products.slice(0, 5).map((p) => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.category}{p.subcategory ? ` · ${p.subcategory}` : ''} · ₹{p.price}
                    </p>
                  </div>
                  <span className="badge badge-gray">{p.historyCount || 0} entries</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!pLoading && products.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              No products yet — add some from the Inventory page.
            </p>
            <div className="badge badge-orange">Full dashboard coming in Step 9</div>
          </div>
        )}

      </div>
    </Layout>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '14px 16px',
      borderLeft: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>{sub}</p>
    </div>
  );
}