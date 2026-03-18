import { useState } from 'react';

function rupees(n) {
  if (n == null || n === '') return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function getLatestSales(history = []) {
  if (!history.length) return null;
  const sorted = [...history].sort(
    (a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0)
  );
  const v = sorted[0]?.sales;
  return v != null ? Number(v) : null;
}

function HistoryBadge({ count }) {
  const cls =
    count >= 30 ? 'badge-green' :
    count > 0   ? 'badge-orange' :
                  'badge-gray';
  return (
    <span className={`badge ${cls}`} style={{ fontSize: 11 }}>
      {count} {count === 1 ? 'entry' : 'entries'}
    </span>
  );
}

function CategoryPill({ label }) {
  return (
    <span className="cat-pill">
      {label || 'Uncategorized'}
    </span>
  );
}

/* ── List row ───────────────────────────────────────────────── */
function ProductRow({ p, onEdit, onDelete }) {
  const latest = getLatestSales(p.history);
  const count  = p.historyCount ?? (p.history || []).length;

  return (
    <tr>
      <td>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.name}</p>
        {p.subcategory && (
          <p className="text-xs text-muted">{p.subcategory}</p>
        )}
      </td>
      <td><CategoryPill label={p.category} /></td>
      <td style={{ fontWeight: 600 }}>{rupees(p.price)}</td>
      <td className="text-muted">{p.city || '—'}</td>
      <td>
        {latest !== null
          ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{rupees(latest)}</span>
          : <span className="text-muted">—</span>}
      </td>
      <td><HistoryBadge count={count} /></td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(p)}>Edit</button>
          <button className="btn btn-danger btn-sm"    onClick={() => onDelete(p)}>Delete</button>
        </div>
      </td>
    </tr>
  );
}

/* ── Card ───────────────────────────────────────────────────── */
function ProductCard({ p, onEdit, onDelete }) {
  const latest = getLatestSales(p.history);
  const count  = p.historyCount ?? (p.history || []).length;
  const initials = (p.name || 'P')[0].toUpperCase();

  return (
    <div className="pt-card">
      <div className="pt-card-top">
        <div className="pt-card-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="pt-card-name">{p.name}</p>
          <p className="text-xs text-muted">{p.city || ''}</p>
        </div>
        <span style={{ fontWeight: 700, color: 'var(--primary-darker)', fontSize: 14, flexShrink: 0 }}>
          {rupees(p.price)}
        </span>
      </div>

      <div className="pt-card-pills">
        <CategoryPill label={p.category} />
        {p.subcategory && (
          <span className="text-xs text-muted">{p.subcategory}</span>
        )}
      </div>

      <div className="pt-card-stats">
        <div>
          <p className="text-xs text-muted">Last sales</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: latest ? 'var(--success)' : 'var(--text-muted)' }}>
            {latest !== null ? rupees(latest) : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-xs text-muted">History</p>
          <HistoryBadge count={count} />
        </div>
      </div>

      <div className="pt-card-actions">
        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onEdit(p)}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => onDelete(p)}>
          Delete
        </button>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function ProductTable({ products, loading, onEdit, onDelete }) {
  const [view,      setView]      = useState('list');
  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [sortBy,    setSortBy]    = useState('newest');

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();

  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        (!q ||
          p.name.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.city || '').toLowerCase().includes(q)) &&
        (!filterCat || p.category === filterCat)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name')  return a.name.localeCompare(b.name);
      if (sortBy === 'price') return Number(b.price || 0) - Number(a.price || 0);
      return 0; // newest: Firestore already returns desc
    });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="pt-toolbar">
        <div className="input-icon-wrap" style={{ flex: '1 1 220px', minWidth: 0 }}>
          <svg className="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            className="input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ flex: '0 0 150px' }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="select"
          style={{ flex: '0 0 140px' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="price">Price high–low</option>
        </select>

        {/* View toggle */}
        <div className="pt-view-toggle">
          <button
            className={`pt-vt-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
            title="List view"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className={`pt-vt-btn ${view === 'cards' ? 'active' : ''}`}
            onClick={() => setView('cards')}
            title="Card view"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3"  y="3"  width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
              <rect x="13" y="3"  width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
              <rect x="3"  y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
              <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Result count */}
      {(search || filterCat) && (
        <p className="text-sm text-muted" style={{ margin: '8px 0 16px 2px' }}>
          {filtered.length} of {products.length} products
          {search && ` matching "${search}"`}
          {filterCat && ` in ${filterCat}`}
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="pt-empty">
          <div className="pt-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"
                stroke="var(--text-light)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                stroke="var(--text-light)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>{search || filterCat ? 'No products found' : 'No products yet'}</h3>
          <p className="text-muted">
            {search || filterCat
              ? 'Try clearing the search or filter.'
              : 'Click "+ Add product" above to add your first product.'}
          </p>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && filtered.length > 0 && (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>City</th>
                <th>Last Sales</th>
                <th>History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProductRow key={p.id} p={p} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CARD VIEW */}
      {view === 'cards' && filtered.length > 0 && (
        <div className="pt-cards-grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}