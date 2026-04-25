import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { useProducts } from '../lib/hooks/useProducts';
import { usePredictions } from '../lib/hooks/usePredictions';
import { useDashboardStats } from '../lib/hooks/useDashboardStats';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Sector } from 'recharts';
import { addHistoryEntry } from '../lib/firestore';

const dummyChartData = [
  { name: 'Feb 1', line1: 400, line2: 600, line3: 200 },
  { name: 'Feb 4', line1: 300, line2: 400, line3: 350 },
  { name: 'Feb 8', line1: 450, line2: 700, line3: 500 },
  { name: 'Feb 12', line1: 650, line2: 500, line3: 400 },
  { name: 'Feb 15', line1: 500, line2: 600, line3: 750 },
  { name: 'Feb 18', line1: 400, line2: 450, line3: 850 },
  { name: 'Feb 22', line1: 700, line2: 800, line3: 650 },
];

const mockDailyEntries = [
  { id: 'm1', name: 'Aura Headphones', category: 'Electronics', price: 299.99, type: 'tap' },
  { id: 'm2', name: 'Zen Smartwatch', category: 'Accessories', stock: 124, type: 'quick' },
  { id: 'm3', name: 'Eco Backpack', category: 'Gear', stock: 123, type: 'tap' },
  { id: 'm4', name: 'Apex Laptop', category: 'Computers', stock: 124, type: 'quick' },
];

const donutDataMock = [
  { name: 'X1 Phone', value: 3200, trendPercent: 15, color: '#ef4444', bg: '#fee2e2', width: '90%', rank: 1 },
  { name: 'Vibe Watch', value: 1850, trendPercent: -5, color: '#ec4899', bg: '#fce7f3', width: '55%', rank: 2 },
  { name: 'Pro Pods', value: 1600, trendPercent: 12, color: '#9333ea', bg: '#f3e8ff', width: '45%', rank: 3 },
  { name: 'Graduets', value: 1400, trendPercent: 8, color: '#8b5cf6', bg: '#ede9fe', width: '35%', rank: 4 },
  { name: 'Echo Speaker', value: 1200, trendPercent: -2, color: '#6366f1', bg: '#e0e7ff', width: '30%', rank: 5 },
  { name: 'Nano Tablet', value: 900, trendPercent: 20, color: '#06b6d4', bg: '#cffafe', width: '20%', rank: 6 },
  { name: 'Gamer Mouse', value: 700, trendPercent: 4, color: '#0d9488', bg: '#ccfbf1', width: '15%', rank: 7 },
  { name: 'Pixel Ring', value: 300, trendPercent: 0, color: '#22c55e', bg: '#dcfce7', width: '8%', rank: 8 },
];

const CustomTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x="0" y="20" dy="0" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="500">
        {payload.value}
      </text>
    </g>
  );
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const percentage = Math.round(percent * 100);

  if (percentage < 4) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="600">
      {`${percentage}%`}
    </text>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={6}
      />
    </g>
  );
};

function normalizeDate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildProductTrendData(products, selectedProductId) {
  if (!products || products.length === 0) return { data: dummyChartData, count: 1 };

  const isOverview = selectedProductId === 'all';

  // 1. Find the overall max date
  let globalMaxDateObj = null;
  products.forEach((p) => {
    (p.history || []).forEach((h) => {
      if (!h.orderDate) return;
      const d = new Date(h.orderDate);
      if (!globalMaxDateObj || d > globalMaxDateObj) globalMaxDateObj = d;
    });
  });

  if (!globalMaxDateObj) return { data: dummyChartData, count: 1 };

  // 2. Generate last 30 days of dates
  const timelineDates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(globalMaxDateObj);
    d.setDate(d.getDate() - i);
    timelineDates.push(normalizeDate(d));
  }

  // 3. Build data rows
  const data = timelineDates.map((targetDate) => {
    const row = {
      date: targetDate,
      name: new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    };

    if (isOverview) {
      let totalDaySales = 0;
      products.forEach(p => {
        const entry = (p.history || []).find(h => normalizeDate(h.orderDate) === targetDate);
        if (entry) totalDaySales += (Number(entry.sales) || 0);
      });
      row.line1 = totalDaySales;
    } else {
      const p = products.find(prod => prod.id === selectedProductId);
      if (p) {
        const entry = (p.history || []).find(h => normalizeDate(h.orderDate) === targetDate);
        row.line1 = entry ? (Number(entry.sales) || 0) : 0;
      } else {
        row.line1 = 0;
      }
    }
    return row;
  });

  return { data, count: 1 };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { products } = useProducts();
  const { predictions } = usePredictions();
  const stats = useDashboardStats(products, predictions);

  const [selectedProduct, setSelectedProduct] = useState('all');
  const [activePieIndex, setActivePieIndex] = useState(null);

  // Separate timeframe states
  const [salesTimeframe, setSalesTimeframe] = useState('monthly');
  const [topTimeframe, setTopTimeframe] = useState('weekly');

  // Inline entry state
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [entrySales, setEntrySales] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSalesClick = () => {
    if (salesTimeframe === 'monthly') setSalesTimeframe('weekly');
    else if (salesTimeframe === 'weekly') setSalesTimeframe('yearly');
    else setSalesTimeframe('monthly');
  };

  const handleSaveEntry = async (productId) => {
    if (!entrySales || !entryDate || isSaving) return;

    setIsSaving(true);
    try {
      await addHistoryEntry(user.uid, productId, {
        sales: Number(entrySales),
        orderDate: entryDate
      });
      setEditingEntryId(null);
      setEntrySales('');
      // Ideally trigger a re-fetch or use optimistic updates
      // The useProducts hook should pick up the change if it's listening
    } catch (err) {
      console.error("Failed to add entry:", err);
      alert("Error saving entry");
    } finally {
      setIsSaving(false);
    }
  };

  const accString = stats.avgAccuracy != null ? `${stats.avgAccuracy}%` : '—';
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const maxDatasetDate = useMemo(() => {
    let max = 0;
    (products || []).forEach(p => {
      (p.history || []).forEach(h => {
        if (!h.orderDate) return;
        const d = new Date(h.orderDate).getTime();
        if (d > max) max = d;
      });
    });
    return max > 0 ? new Date(max) : new Date();
  }, [products]);

  const { data: chartData, count: lineCount } = useMemo(() => {
    return buildProductTrendData(products, selectedProduct);
  }, [products, selectedProduct]);

  const dailyEntries = products.length >= 4
    ? products.slice(0, 4).map((p, i) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'General',
      price: p.price,
      stock: p.stock || 0,
      type: i % 2 === 0 ? 'tap' : 'quick'
    }))
    : mockDailyEntries;

  // Filter logic for Total Sales Card
  const totalRevenue = useMemo(() => {
    if (!products || !products.length) return 0;
    const now = new Date(maxDatasetDate);
    const startDate = new Date(now);
    if (salesTimeframe === 'weekly') startDate.setDate(now.getDate() - 7);
    else if (salesTimeframe === 'monthly') startDate.setDate(now.getDate() - 30);
    else if (salesTimeframe === 'yearly') startDate.setDate(now.getDate() - 365);

    let sum = 0;
    products.forEach(p => {
      (p.history || []).forEach(h => {
        if (!h.orderDate) return;
        const d = new Date(h.orderDate);
        if (d >= startDate) {
          sum += (Number(h.sales) || 0);
        }
      });
    });
    return sum;
  }, [products, salesTimeframe, maxDatasetDate]);

  // Filter logic for Top Products Card (Pie Chart represents contribution to global total)
  const { topProductSalesData, topPeriodTotalRevenue } = useMemo(() => {
    if (!products || !products.length) return { topProductSalesData: [], topPeriodTotalRevenue: 0 };

    const now = new Date(maxDatasetDate);
    const startDate = new Date(now);
    if (topTimeframe === 'weekly') startDate.setDate(now.getDate() - 7);
    else if (topTimeframe === 'monthly') startDate.setDate(now.getDate() - 30);
    else if (topTimeframe === 'yearly') startDate.setDate(now.getDate() - 365);

    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);

    let globalPeriodTotal = 0;
    let pStats = products.map(p => {
      let revenue = 0;
      let currentWeekUnits = 0;
      let prevWeekUnits = 0;

      (p.history || []).forEach(h => {
        if (!h.orderDate) return;
        const d = new Date(h.orderDate);
        const s = Number(h.sales) || 0;

        if (d >= startDate) {
          revenue += s;
        }

        // Trend is always weekly
        if (d >= weekAgo) {
          currentWeekUnits += s;
        } else if (d >= twoWeeksAgo && d < weekAgo) {
          prevWeekUnits += s;
        }
      });

      globalPeriodTotal += revenue;

      let trendPercent = 0;
      if (prevWeekUnits > 0) {
        trendPercent = ((currentWeekUnits - prevWeekUnits) / prevWeekUnits) * 100;
      } else if (currentWeekUnits > 0) {
        trendPercent = 100;
      }

      return {
        ...p,
        periodRevenue: revenue,
        trendPercent: Math.round(trendPercent)
      };
    });

    const withSales = pStats.filter(p => p.periodRevenue > 0).sort((a, b) => b.periodRevenue - a.periodRevenue);

    if (withSales.length === 0) return { topProductSalesData: [], topPeriodTotalRevenue: 0 };

    // Slice Top 8
    const topN = withSales.slice(0, 8);
    const topNRevenue = topN.reduce((s, x) => s + x.periodRevenue, 0);
    const othersRevenue = globalPeriodTotal - topNRevenue;

    const colors = ['#ef4444', '#ec4899', '#9333ea', '#8b5cf6', '#6366f1', '#06b6d4', '#0d9488', '#22c55e'];
    const bgs = ['#fee2e2', '#fce7f3', '#f3e8ff', '#ede9fe', '#e0e7ff', '#cffafe', '#ccfbf1', '#dcfce7'];

    let finalData = topN.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      color: colors[idx % colors.length],
      bg: bgs[idx % bgs.length],
      width: `${topN[0].periodRevenue > 0 ? Math.round((p.periodRevenue / topN[0].periodRevenue) * 100) : 0}%`,
      value: p.periodRevenue
    }));

    // Add Others slice if there's remaining revenue
    if (othersRevenue > 0) {
      finalData.push({
        name: 'Others',
        value: othersRevenue,
        color: '#a1a1aa',
        bg: '#f4f4f5',
        rank: 'N/A',
        width: '0%',
        isOther: true
      });
    }

    return { topProductSalesData: finalData, topPeriodTotalRevenue: globalPeriodTotal };
  }, [products, topTimeframe, maxDatasetDate]);

  const finalDonutData = topProductSalesData.length > 0 ? topProductSalesData : donutDataMock;
  // Filter out "Others" from the list below the chart to keep it focused on top products
  const displayTopList = finalDonutData.filter(x => !x.isOther).slice(0, 6);
  const donutTotalSales = topPeriodTotalRevenue || finalDonutData.reduce((sum, item) => sum + item.value, 0);

  const topTimeframeLabel = topTimeframe === 'weekly' ? 'This Week' : topTimeframe === 'monthly' ? 'This Month' : topTimeframe === 'yearly' ? 'This Year' : 'Custom Date';

  const flashPoints = useMemo(() => {
    const points = [];

    // 1. Growth Point
    const bestGrower = [...topProductSalesData].filter(x => !x.isOther).sort((a, b) => b.trendPercent - a.trendPercent)[0];
    if (bestGrower && bestGrower.trendPercent > 0) {
      points.push({
        icon: '🚀',
        title: 'High Growth Alert',
        text: `${bestGrower.name} is up ${bestGrower.trendPercent}% this week. Consider increasing stock.`
      });
    }

    // 2. Accuracy Point
    if (stats.avgAccuracy !== null) {
      points.push({
        icon: '🎯',
        title: 'Prediction Health',
        text: `Your current prediction accuracy is ${stats.avgAccuracy}%. Keep adding actual sales to improve logic.`
      });
    } else {
      points.push({
        icon: '📝',
        title: 'Start Tracking',
        text: 'Add actual sales data for your predictions to see accuracy insights here.'
      });
    }

    // 3. Category Tip
    const categories = {};
    products.forEach(p => { if (p.category) categories[p.category] = (categories[p.category] || 0) + 1; });
    const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      points.push({
        icon: '💡',
        title: 'Inventory Strategy',
        text: `${topCat[0]} is your largest category. Ensure pricing is competitive for these items.`
      });
    }

    return points;
  }, [products, topProductSalesData, stats.avgAccuracy]);

  const topInsights = useMemo(() => {
    return [...topProductSalesData]
      .filter(x => !x.isOther)
      .slice(0, 3)
      .map(p => ({
        name: p.name,
        growth: p.trendPercent,
        color: p.trendPercent >= 0 ? 'green' : 'blue'
      }));
  }, [topProductSalesData]);

  return (
    <Layout title="Dashboard">
      <div id="dashboard-override">
        <div className="new-dash">

          {/* Top Section */}
          <div className="top-section">
            <div className="header-row">
              <div className="profile">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="avatar" />
                <span className="profile-name">{user?.displayName || 'Alex_User77'}</span>
              </div>
              <div className="date-pill">{currentDate}</div>
            </div>
            <h1 className="welcome-title">Welcome Back,<br />{user?.displayName || 'Alex_User77'}</h1>
          </div>

          <div className="cards-container">

            {/* Metrics Cards */}
            <div className="top-cards">
              <div className="m-card">
                <div className="card-header">
                  <span className="card-title">Total Products</span>
                  <div className="card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <h2 className="card-val">{stats.totalProducts || '12,450'}</h2>
                <span className="trend up">↗ 3%</span>
              </div>
              <div
                className="m-card interactive-card"
                onClick={handleSalesClick}
              >
                <div className="card-header">
                  <span className="card-title">Total Sales</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="timeframe-pill">
                      {salesTimeframe}
                    </span>
                    <div className="card-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="18" y="3" width="4" height="18" />
                        <rect x="10" y="8" width="4" height="13" />
                        <rect x="2" y="13" width="4" height="8" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h2 className="card-val">₹{totalRevenue ? totalRevenue.toLocaleString() : '89,750'}</h2>
                <span className="trend up">↗ 12%</span>
              </div>
            </div>

            <div className="mid-cards">
              <div className="m-card small-card">
                <div className="card-header" style={{ marginBottom: 0 }}>
                  <span className="card-title">Average Accuracy</span>
                  <div className="card-icon" style={{ background: 'transparent', width: 'auto', color: '#64748b' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                </div>
                <h2 className="card-val">{accString !== '—' ? accString : '94.2%'}</h2>
                <span className="trend neutral">Based on set actuals</span>
              </div>
              <div className="m-card small-card">
                <span className="card-title">Last Prediction</span>
                <h2 className="card-val" style={{ fontSize: '32px', margin: '12px 0 6px' }}>
                  ₹{Math.round(stats.lastPrediction?.predicted || 1200).toLocaleString()}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#52525b' }}>
                    {stats.lastPrediction?.productName || 'Noodle Pack'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '500' }}>
                    Prediction for {stats.lastPrediction?.predictionDate ? new Date(stats.lastPrediction.predictionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '24 Apr 2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Flash Points */}
            <div className="flash-points m-card mt-16">
              <div className="fp-header">
                <h2 className="card-title-lg" style={{ margin: 0 }}>Flash Points</h2>
                <div className="arrow-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              <h3 className="fp-subtitle">Smart Business Insights</h3>
              <ul className="fp-list">
                {flashPoints.map((pt, i) => (
                  <li key={i}><span className="icon">{pt.icon}</span> <div><strong>{pt.title}:</strong> {pt.text}</div></li>
                ))}
              </ul>

              {topInsights.length > 0 && (
                <>
                  <h3 className="fp-subtitle" style={{ marginTop: 24 }}>Top performer products insights</h3>
                  <div className="insights-list">
                    {topInsights.map((insight, i) => (
                      <div key={i} className="insight-item">
                        <div className="insight-text">
                          <span className="icon">{insight.growth >= 0 ? '📈' : '📉'}</span>
                          {insight.name}: {insight.growth >= 0 ? `+${insight.growth}` : insight.growth}% growth.
                        </div>
                        <div className="bar-group">
                          <div className={`bar ${insight.color}`}></div>
                          <div className={`bar ${insight.color}`}></div>
                          <div className="bar"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 className="fp-subtitle" style={{ marginTop: 24 }}>Recent Assistant Tip</h3>
              <div className="chat-preview">
                <div className="chat-bubble left">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: 20, height: 20, background: '#1e2046', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    {stats.avgAccuracy > 90
                      ? "Great job! Your predictions are highly accurate. Consider expanding your inventory to capitalize on this predictability."
                      : "Tip: Adding more historical sales data will significantly improve your weekly demand forecasts."}
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Trend Chart */}
            <div className="m-card mt-16">
              <h2 className="card-title-lg">Sales trend by product</h2>

              <div className="custom-select">
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', appearance: 'none', color: '#3f3f46', fontSize: '15px', fontWeight: '500' }}>
                  <option value="all">All Products Overview</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none', marginLeft: '-20px' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorLine1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLine2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLine3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomTick />}
                      interval="preserveStartEnd"
                      minTickGap={20}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: '500' }}
                      tickFormatter={(val) => `₹${val}`}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales Amount']}
                    />
                    <Area type="monotone" dataKey="line1" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorLine1)" />
                    {lineCount > 1 && <Area type="monotone" dataKey="line2" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorLine2)" />}
                    {lineCount > 2 && <Area type="monotone" dataKey="line3" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#colorLine3)" />}
                  </AreaChart>
                </ResponsiveContainer>
                <div className="grid-overlay">
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                </div>
              </div>
            </div>

            {/* Daily Entries Card */}
            <div className="m-card mt-16">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title-lg">Daily entries</h2>
                  <span className="card-sub">Tap to enter sales</span>
                </div>
                <button className="show-all-btn">
                  Show all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>

              <div className="list-group">
                {products.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="list-item-wrapper">
                    <div
                      className={`list-item ${editingEntryId === item.id ? 'editing' : ''}`}
                      onClick={() => setEditingEntryId(editingEntryId === item.id ? null : item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="item-left">
                        <div className="item-icon-circle">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div className="item-info">
                          <span className="item-title">{item.name}</span>
                          <span className="item-sub">{item.category}</span>
                        </div>
                      </div>
                      <div className="item-right">
                        <span className="action-text tap">Tap to enter</span>
                        <span className="action-val">₹{item.price}</span>
                      </div>
                    </div>

                    {editingEntryId === item.id && (
                      <div className="inline-entry-form" onClick={(e) => e.stopPropagation()}>
                        <div className="entry-inputs">
                          <input
                            type="date"
                            className="entry-date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="Units Sold"
                            className="entry-sales"
                            value={entrySales}
                            onChange={(e) => setEntrySales(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <button
                          className="save-entry-btn"
                          onClick={() => handleSaveEntry(item.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save Record'}
                        </button>
                      </div>
                    )}
                    {index < 4 && <div className="divider"></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products Card */}
            <div className="m-card mt-16" style={{ paddingBottom: '32px' }}>
              <div className="card-header-row" style={{ marginBottom: '32px' }}>
                <h2 className="card-title-lg">Top products</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={topTimeframe}
                    onChange={(e) => setTopTimeframe(e.target.value)}
                    style={{ fontSize: '12px', border: '1px solid #e4e4e7', borderRadius: '6px', padding: '4px 8px', outline: 'none', background: '#f8fafc', color: '#475569', fontWeight: '500' }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="specific">Specific Date</option>
                  </select>
                  <span className="card-sub">{topTimeframeLabel}</span>
                </div>
              </div>

              <div className="donut-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={finalDonutData}
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onClick={(_, index) => setActivePieIndex(index)}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={115}
                      paddingAngle={4}
                      cornerRadius={8}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {finalDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer', outline: 'none' }} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-text">
                  <span style={{ fontSize: '32px', fontWeight: '800', color: '#1e1b4b' }}>₹{donutTotalSales.toLocaleString()}</span>
                </div>
              </div>

              <h3 className="fp-subtitle" style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '14px', marginBottom: '20px' }}>Product Sales</h3>

              <div className="product-list-progress">
                {displayTopList.map((item, index) => (
                  <div
                    key={item.name}
                    className="pl-item"
                    onClick={() => setActivePieIndex(index)}
                    style={{
                      cursor: 'pointer', padding: '12px', borderRadius: '16px', margin: '-12px',
                      backgroundColor: activePieIndex === index ? '#f4f4f5' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div className="pl-icon-box" style={{ backgroundColor: item.bg, color: '#1e1b4b' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="4" />
                      </svg>
                    </div>
                    <div className="pl-info">
                      <div className="pl-header">
                        <span className="pl-name">{item.name}</span>
                        <span className="pl-rank">#{item.rank} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M7 17L17 7M17 7H9M17 7V15" /></svg></span>
                      </div>
                      <div className="pl-bar-bg" style={{ backgroundColor: item.bg }}>
                        <div className="pl-bar-fill" style={{ backgroundColor: item.color, width: item.width }}></div>
                      </div>
                      <span className="pl-sold" style={{ color: item.trendPercent >= 0 ? '#10b981' : '#f43f5e', fontWeight: '600', marginTop: '2px' }}>
                        {item.trendPercent >= 0 ? '↗' : '↘'} {Math.abs(item.trendPercent)}% from last week
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        body:has(#dashboard-override) .app-main { padding: 0 !important; }
        body:has(#dashboard-override) .app-content { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
        body:has(#dashboard-override) .top-bar { display: none !important; }
        body:has(#dashboard-override) {
          background-color: #f7f5fa !important;
        }
        
        #dashboard-override {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 100;
        }

        .new-dash {
          background-color: #f7f5fa;
          min-height: 100vh;
          padding-bottom: 140px;
          font-family: 'Outfit', sans-serif;
        }

        .top-section {
          background: linear-gradient(145deg, #1f1d3c 0%, #28254c 100%);
          border-bottom-left-radius: 40px;
          border-bottom-right-radius: 40px;
          padding: 60px 24px 80px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .top-section::before {
          content: ''; position: absolute;
          top: 0%; right: -20%; width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
        }
        .top-section::after {
          content: ''; position: absolute;
          bottom: -10%; left: -10%; width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
        }

        .header-row {
          display: flex; justify-content: space-between; align-items: center;
          position: relative; z-index: 2;
        }
        .profile {
          display: flex; align-items: center; gap: 12px;
        }
        .profile img {
          width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2);
          object-fit: cover;
        }
        .profile-name { font-size: 17px; font-weight: 500; }
        .date-pill {
          background: rgba(255,255,255,0.15);
          padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;
          backdrop-filter: blur(10px);
        }
        .welcome-title {
          position: relative; z-index: 2;
          font-size: 34px; font-weight: 700; margin-top: 32px; line-height: 1.15;
          letter-spacing: -0.5px;
          color: #fff;
        }

        .cards-container {
          padding: 0 20px; margin-top: -40px;
          position: relative; z-index: 10;
        }
        .m-card {
          background: white; border-radius: 24px; padding: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .interactive-card {
          cursor: pointer;
          user-select: none;
        }
        .interactive-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }
        .interactive-card:active {
          transform: scale(0.96);
        }
        .timeframe-pill {
          font-size: 11px; 
          background: #f1f5f9; 
          color: #475569; 
          padding: 4px 10px; 
          border-radius: 20px; 
          font-weight: 700; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .mt-16 { margin-top: 16px; padding: 24px; }
        
        .top-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mid-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .card-title { font-size: 12px; font-weight: 500; color: #3f3f46; }
        .card-icon { 
          width: 32px; height: 32px; background: #f3e8ff; border-radius: 10px; 
          display: flex; align-items: center; justify-content: center;
          color: #8b5cf6;
        }
        .card-val { font-size: 28px; font-weight: 800; margin: 0 0 6px; color: #1e1b4b; letter-spacing: -0.5px; }
        
        .trend { font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
        .trend.up { color: #10b981; }
        .trend.neutral { color: #71717a; }
        .trend.up::after { content: " From last week"; color: #71717a; font-weight: 400; }
        .top-cards .m-card:nth-child(2) .trend.up::after { content: " From Sept 23"; }

        .small-card .card-val { font-size: 26px; margin-top: 8px; }
        .pred-name { display: block; font-size: 14px; font-weight: 600; color: #3f3f46; margin-top: 10px; }
        .pred-sub { display: block; font-size: 13px; color: #71717a; margin-top: 2px; }
        .pred-val { display: block; font-size: 15px; font-weight: 700; color: #1e1b4b; margin-top: 6px; }

        .fp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .arrow-btn { 
          width: 36px; height: 36px; background: #f4f4f5; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #71717a;
        }
        
        .fp-subtitle { font-size: 16px; font-weight: 600; color: #1e1b4b; margin: 0 0 14px; }
        .fp-list { list-style: none; padding: 0; margin: 0 0 24px; }
        .fp-list li { font-size: 14px; color: #3f3f46; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;}
        .fp-list li strong { color: #1e1b4b; font-weight: 600; }
        .icon { font-size: 16px; flex-shrink: 0; }

        .insights-list { margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;}
        .insight-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #3f3f46; }
        .insight-text { display: flex; align-items: center; gap: 8px; }
        .bar-group { display: flex; flex-direction: column; gap: 4px; width: 44px; }
        .bar { height: 4px; border-radius: 2px; width: 100%; background: #e4e4e7; }
        .bar.green { background: #10b981; }
        .bar.gray { background: #64748b; }
        .bar.blue { background: #3b82f6; }

        .chat-preview {
          background: white; border-radius: 16px; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          border: 1px solid #f4f4f5;
        }
        .chat-bubble { padding: 12px 16px; border-radius: 16px; font-size: 13px; max-width: 85%; font-weight: 500; line-height: 1.4;}
        .chat-bubble.right { 
          background: #1e2046; color: white; align-self: flex-end; 
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.left {
          background: white; color: #3f3f46; align-self: flex-start;
          border-bottom-left-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .card-title-lg { font-size: 22px; font-weight: 600; color: #1e1b4b; margin: 0 0 16px; }
        
        .custom-select {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border: 1px solid #e4e4e7; border-radius: 12px;
          background: white;
          margin-bottom: 24px;
          position: relative;
        }

        .chart-wrapper {
          position: relative;
          margin-top: 10px;
        }

        .grid-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 30px;
          display: flex; justify-content: space-between;
          pointer-events: none;
        }
        .grid-line {
          width: 1px; height: 100%; background: rgba(0,0,0,0.04);
        }

        .card-header-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 24px;
        }
        .card-header-row .card-title-lg { margin: 0 0 4px; }
        .card-sub { font-size: 13px; color: #71717a; }
        .show-all-btn {
          display: flex; align-items: center; gap: 4px;
          background: none; border: none; color: #71717a; font-size: 13px; font-weight: 500;
          padding: 0; cursor: pointer; font-family: 'Outfit', sans-serif;
        }

        .list-group {
          display: flex; flex-direction: column;
        }
        .list-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0;
        }
        .divider {
          height: 1px; background: #f4f4f5; margin: 8px 0;
        }
        .item-left {
          display: flex; align-items: center; gap: 16px;
        }
        .item-icon-circle {
          width: 48px; height: 48px; background: #f4f4f5; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #1e1b4b;
        }
        .item-info { display: flex; flex-direction: column; gap: 2px; }
        .item-title { font-size: 15px; font-weight: 600; color: #1e1b4b; }
        .item-sub { font-size: 13px; color: #71717a; font-weight: 500; }

        .item-right {
          display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
        }
        .action-text { font-size: 14px; font-weight: 600; }
        .action-text.tap { color: #1e1b4b; }
        .action-text.quick { color: #1e1b4b; }
        .action-val { font-size: 13px; color: #3f3f46; font-weight: 600;}
        .action-val.stock { color: #71717a; font-weight: 500;}

        /* Top Products Card Styles */
        .list-item.editing {
          background: #f8fafc;
        }
        
        .inline-entry-form {
          padding: 12px 16px 16px;
          background: #f8fafc;
          border-radius: 0 0 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: slideDown 0.2s ease-out;
          margin-top: -8px;
          border-top: 1px solid #f1f5f9;
        }
        
        @media (max-width: 600px) {
          .inline-entry-form {
            padding: 10px 12px 12px;
            gap: 10px;
          }
          .entry-date, .entry-sales {
            font-size: 13px;
            padding: 8px;
          }
          .save-entry-btn {
            padding: 10px;
            font-size: 13px;
          }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .entry-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .entry-date, .entry-sales {
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          color: #1e1b4b;
        }
        
        .entry-date:focus, .entry-sales:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        
        .save-entry-btn {
          background: #1e1b4b;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .save-entry-btn:hover {
          background: #2d2a5d;
        }
        
        .save-entry-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .donut-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 24px;
        }
        .donut-center-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-list-progress {
          display: flex; flex-direction: column; gap: 24px;
        }
        .pl-item {
          display: flex; gap: 16px; align-items: flex-start;
        }
        .pl-icon-box {
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pl-info {
          flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 2px;
        }
        .pl-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .pl-name { font-weight: 700; color: #1e1b4b; font-size: 16px; }
        .pl-rank { font-weight: 700; color: #1e1b4b; font-size: 14px; display: flex; align-items: center; gap: 4px;}
        .pl-bar-bg {
          width: 100%; height: 10px; border-radius: 5px; overflow: hidden;
        }
        .pl-bar-fill {
          height: 100%; border-radius: 5px;
        }
        .pl-sold {
          font-size: 13px; color: #a1a1aa; font-weight: 500; margin-top: -2px;
        }

      `}</style>
    </Layout>
  );
}