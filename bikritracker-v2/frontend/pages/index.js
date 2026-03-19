// pages/index.js
import { useMemo } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, Legend,
} from 'recharts';
import Layout from '../components/layout/Layout';
import { useProducts } from '../lib/hooks/useProducts';
import { usePredictions } from '../lib/hooks/usePredictions';
import { useDashboardStats } from '../lib/hooks/useDashboardStats';
import { useAuth } from '../contexts/AuthContext';

/* ── palette for per-product lines ──────────────────────────── */
const LINE_COLORS = [
  'var(--primary)',
  '#8b5cf6',
  '#10b981',
  '#3b82f6',
  '#f59e0b',
];

/* ── helpers ────────────────────────────────────────────────── */
function rupees(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Build per-product trend data for LineChart ─────────────── */
function buildProductTrendData(products) {
  // take top 5 products by total history count
  const top = [...products]
    .sort((a, b) => (b.historyCount ?? (b.history || []).length) - (a.historyCount ?? (a.history || []).length))
    .slice(0, 5);

  if (!top.length) return { data: [], products: [] };

  // collect all dates across top products (last 30 days)
  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);

  const dateSet = new Set();
  top.forEach((p) => {
    (p.history || []).forEach((h) => {
      if (h.orderDate && new Date(h.orderDate) >= thirtyAgo) {
        dateSet.add(h.orderDate);
      }
    });
  });

  const sortedDates = [...dateSet].sort();
  if (!sortedDates.length) return { data: [], products: top };

  // build one row per date
  const data = sortedDates.map((date) => {
    const row = {
      date,
      label: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
    top.forEach((p) => {
      const entry = (p.history || []).find((h) => h.orderDate === date);
      row[p.name] = entry ? Number(entry.sales) : null;
    });
    return row;
  });

  return { data, products: top };
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color, loading, isEmpty }) {
  return (
    <div className="dash-stat-card" style={{ borderTopColor: color }}>
      <div className="dash-stat-icon" style={{ background: `${color}18` }}>
        {icon}
      </div>
      <div className="dash-stat-body">
        <p className="dash-stat-label">{label}</p>
        {loading
          ? <span className="spinner" style={{ width: 20, height: 20, margin: '4px 0' }} />
          : <p className="dash-stat-value" style={{ color: isEmpty ? 'var(--text-light)' : undefined }}>
              {value}
            </p>}
        <p className="dash-stat-sub">{sub}</p>
      </div>
    </div>
  );
}

/* ── Custom tooltip ─────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip-label">{label}</p>
      {payload.filter(p => p.value != null).map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600, fontSize: 13 }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
}

function AccTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip-label">{label}</p>
      <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
        Accuracy: {payload[0]?.value}%
      </p>
      {payload[0]?.payload?.productName && (
        <p className="text-xs text-muted">{payload[0].payload.productName}</p>
      )}
    </div>
  );
}

/* ── No-data banner (shown inside charts when empty) ────────── */
function NoDataBanner({ message, hint }) {
  return (
    <div className="dash-chart-empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 17l4-8 5 4 4-8 5 9" stroke="var(--border-strong)"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p className="text-sm text-muted">{message}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const { products, loading: pLoading } = useProducts();
  const { predictions, loading: predLoading } = usePredictions();
  const stats = useDashboardStats(products, predictions);

  const isLoading   = pLoading || predLoading;
  const hasProducts = products.length > 0;
  const hasPreds    = predictions.length > 0;
  const storeName   = user?.displayName || 'there';

  const { data: trendData, products: trendProducts } = useMemo(
    () => buildProductTrendData(products),
    [products]
  );

  const accColor =
    stats.avgAccuracy == null ? 'var(--text-muted)' :
    stats.avgAccuracy >= 80   ? 'var(--success)'    :
    stats.avgAccuracy >= 60   ? 'var(--warning)'    : 'var(--error)';

  return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Greeting ────────────────────────────────────────── */}
        <div className="dash-greeting">
          <div>
            <h2 style={{ margin: 0 }}>
              {greeting()}, {storeName} 👋
            </h2>
            <p className="text-muted" style={{ marginTop: 4, fontSize: 14 }}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/inventory">
              <button className="btn btn-secondary btn-sm">+ Add product</button>
            </Link>
            <Link href="/predict">
              <button className="btn btn-primary btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Predict
              </button>
            </Link>
          </div>
        </div>

        {/* ── "No data" notice for new users ──────────────────── */}
        {!isLoading && !hasProducts && (
          <div className="alert alert-success" style={{
            background: 'var(--primary-light)',
            borderColor: 'var(--primary-muted)',
            color: 'var(--primary-darker)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Welcome! No data yet — add products with sales history to unlock all dashboard charts.
          </div>
        )}

        {/* ── Stat cards (always visible, show 0 when no data) ── */}
        <div className="dash-stats-grid">
          <StatCard
            label="Total Products"
            value={isLoading ? '…' : stats.totalProducts}
            sub={hasProducts ? `${stats.totalHistoryEntries} history entries` : 'No products yet'}
            color="var(--primary)"
            isEmpty={!hasProducts}
            loading={isLoading}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"
                  stroke="var(--primary)" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                  stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            }
          />
          <StatCard
            label="Predictions Made"
            value={isLoading ? '…' : stats.totalPredictions}
            sub={hasPreds
              ? `${predictions.filter(p => p.actual != null).length} with actuals set`
              : 'Run your first prediction'}
            color="#8b5cf6"
            isEmpty={!hasPreds}
            loading={isLoading}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"
                  stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <StatCard
            label="Avg Accuracy"
            value={isLoading ? '…' : (stats.avgAccuracy != null ? `${stats.avgAccuracy}%` : '—')}
            sub={stats.avgAccuracy != null ? 'Based on set actuals' : 'Set actuals to track'}
            color={accColor}
            isEmpty={stats.avgAccuracy == null}
            loading={isLoading}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={accColor} strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="5" stroke={accColor} strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="2" fill={accColor}/>
              </svg>
            }
          />
          <StatCard
            label="Last Prediction"
            value={isLoading ? '…' : (stats.lastPrediction ? rupees(stats.lastPrediction.predicted) : '—')}
            sub={stats.lastPrediction
              ? `${stats.lastPrediction.productName} · ${stats.lastPrediction.predictionDate}`
              : 'No predictions yet'}
            color="#10b981"
            isEmpty={!stats.lastPrediction}
            loading={isLoading}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 17l4-8 5 4 4-8 5 9"
                  stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
        </div>

        {/* ── Charts row ──────────────────────────────────────── */}
        <div className="dash-charts-row">

          {/* Per-product sales trend */}
          <div className="card dash-chart-card">
            <div className="dash-chart-header">
              <div>
                <h3 style={{ margin: 0 }}>Sales Trend by Product</h3>
                <p className="text-xs text-muted" style={{ marginTop: 3 }}>
                  Last 30 days — top {Math.min(5, trendProducts.length)} products
                </p>
              </div>
            </div>
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(val) => val.length > 18 ? val.slice(0, 18) + '…' : val}
                  />
                  {trendProducts.map((p, i) => (
                    <Line
                      key={p.id}
                      type="monotone"
                      dataKey={p.name}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <NoDataBanner
                message="No trend data yet"
                hint="Add sales history entries in Inventory to see product trends"
              />
            )}
          </div>

          {/* Accuracy trend */}
          <div className="card dash-chart-card">
            <div className="dash-chart-header">
              <div>
                <h3 style={{ margin: 0 }}>Prediction Accuracy</h3>
                <p className="text-xs text-muted" style={{ marginTop: 3 }}>
                  Accuracy % for predictions with actuals set
                </p>
              </div>
              {stats.avgAccuracy != null && (
                <div className="dash-acc-badge" style={{ color: accColor, borderColor: accColor }}>
                  {stats.avgAccuracy}% avg
                </div>
              )}
            </div>
            {stats.accuracyTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.accuracyTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    width={40}
                  />
                  <Tooltip content={<AccTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', stroke: 'var(--primary)', strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <NoDataBanner
                message="No accuracy data yet"
                hint="Run predictions then set actual sales to track accuracy over time"
              />
            )}
          </div>

        </div>

        {/* ── Bottom row: top products + recent predictions ────── */}
        <div className="dash-bottom-row">

          {/* Top products */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Top Products</h3>
              <Link href="/inventory">
                <span style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  View all →
                </span>
              </Link>
            </div>

            {stats.topProducts.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart
                    data={stats.topProducts.map((p, i) => ({
                      name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
                      sales: p.latestSales,
                      fill: LINE_COLORS[i % LINE_COLORS.length],
                    }))}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false}/>
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      tickLine={false} axisLine={false}
                      tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                      width={44}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    
                    <Bar dataKey="sales" name="Last Sales" radius={[4, 4, 0, 0]}>
                      {stats.topProducts.map((_, i) => (
                        <Cell key={i} fill={LINE_COLORS[i % LINE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                  {stats.topProducts.map((p, i) => (
                    <div key={p.id} className="dash-product-row">
                      <div className="dash-product-rank" style={{
                        background: `${LINE_COLORS[i % LINE_COLORS.length]}18`,
                        color: LINE_COLORS[i % LINE_COLORS.length],
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </p>
                        <p className="text-xs text-muted">{p.category || '—'}</p>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)', flexShrink: 0 }}>
                        {rupees(p.latestSales)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <NoDataBanner
                message="No products yet"
                hint="Add products with sales history to see top performers"
              />
            )}
          </div>

          {/* Recent predictions */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Recent Predictions</h3>
              <Link href="/predict">
                <span style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  View all →
                </span>
              </Link>
            </div>

            {hasPreds ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {predictions.slice(0, 5).map((p) => {
                  const acc = p.accuracy;
                  const accC =
                    acc == null ? 'var(--text-muted)' :
                    acc >= 80   ? 'var(--success)'    :
                    acc >= 60   ? 'var(--warning)'    : 'var(--error)';
                  return (
                    <div key={p.id} className="dash-pred-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.productName}
                        </p>
                        <p className="text-xs text-muted">{p.predictionDate}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13 }}>{rupees(p.predicted)}</p>
                        <p style={{ fontSize: 11, fontWeight: 600, color: accC }}>
                          {acc != null ? `${acc}% acc` : 'No actual set'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 12 }}>
                <NoDataBanner
                  message="No predictions yet"
                  hint="Select a product on the Predict page to get started"
                />
                <Link href="/predict">
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>
                    Make first prediction
                  </button>
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}