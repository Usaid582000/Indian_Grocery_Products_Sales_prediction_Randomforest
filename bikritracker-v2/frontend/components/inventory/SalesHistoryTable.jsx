import { useState } from 'react';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Inline editable sales history table used inside ProductModal.
 *
 * Props:
 *   history   Array<{id, orderDate, sales}>
 *   onChange  (newArray) => void
 */
export default function SalesHistoryTable({ history = [], onChange }) {
  const [sortAsc, setSortAsc] = useState(false);

  // display-only sort (doesn't change the underlying array order)
  const displayed = [...history].sort((a, b) => {
    const da = a.orderDate ? new Date(a.orderDate) : new Date(0);
    const db = b.orderDate ? new Date(b.orderDate) : new Date(0);
    return sortAsc ? da - db : db - da;
  });

  function addRow() {
    const today = new Date().toISOString().split('T')[0];
    onChange([...history, { id: genId(), orderDate: today, sales: '' }]);
  }

  function updateRow(id, field, value) {
    onChange(history.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  }

  function removeRow(id) {
    onChange(history.filter((h) => h.id !== id));
  }

  /** Paste CSV: "YYYY-MM-DD,1500" one entry per line */
  function handlePaste(e) {
    const raw = e.clipboardData?.getData('text');
    if (!raw || raw.trim().split('\n').length < 2) return;

    const rows = raw
      .trim()
      .split('\n')
      .map((line) => {
        const parts = line.split(/[,\t]/);
        const dateRaw  = (parts[0] || '').trim();
        const salesRaw = (parts[1] || '').trim().replace(/[^\d.]/g, '');
        const sales    = parseFloat(salesRaw);
        if (!dateRaw || isNaN(sales)) return null;
        return { id: genId(), orderDate: dateRaw, sales };
      })
      .filter(Boolean);

    if (rows.length > 0) {
      e.preventDefault();
      onChange([...history, ...rows]);
    }
  }

  const needsMore = history.length < 30;

  return (
    <div className="history-wrap">

      {/* Section header */}
      <div className="history-head">
        <div>
          <h4 className="history-title">Sales History</h4>
          <p className="history-sub">
            {history.length} {history.length === 1 ? 'entry' : 'entries'}
            {needsMore && (
              <span className="history-warning">
                {' '}· {30 - history.length} more for best predictions
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSortAsc((s) => !s)}
            title="Toggle sort order"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M6 12h12M9 18h6"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {sortAsc ? 'Oldest first' : 'Newest first'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={addRow}
          >
            + Add row
          </button>
        </div>
      </div>

      {/* CSV paste hint */}
      <div className="history-paste-hint">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="9" y="11" width="13" height="10" rx="2"
            stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        Tip: Paste CSV data directly into the table (format: date, sales — one row per line)
      </div>

      {/* Empty state */}
      {history.length === 0 ? (
        <div className="history-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M9 13h6m-3-3v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="var(--text-light)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>No history yet — click &quot;Add row&quot; or paste CSV data.</p>
        </div>
      ) : (
        <div className="history-table-scroll" onPaste={handlePaste}>
          <table className="history-table">
            <thead>
              <tr>
                <th className="ht-num">#</th>
                <th>Date</th>
                <th>Sales (₹)</th>
                <th className="ht-del" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, idx) => (
                <tr key={row.id}>
                  <td className="ht-num">{idx + 1}</td>
                  <td>
                    <input
                      type="date"
                      className="ht-input"
                      value={row.orderDate || ''}
                      onChange={(e) => updateRow(row.id, 'orderDate', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="ht-input"
                      placeholder="0"
                      min="0"
                      value={row.sales === '' ? '' : row.sales}
                      onChange={(e) => updateRow(row.id, 'sales', e.target.value)}
                    />
                  </td>
                  <td className="ht-del">
                    <button
                      type="button"
                      className="ht-del-btn"
                      onClick={() => removeRow(row.id)}
                      title="Delete row"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}