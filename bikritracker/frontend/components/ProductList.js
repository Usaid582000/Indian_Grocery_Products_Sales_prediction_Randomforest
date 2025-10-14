// frontend/components/ProductList.js
import React, { useState, useLayoutEffect, useRef } from "react";

/* helpers (unchanged behaviour) */
function getLatestSalesValue(history) {
  if (!history || history.length === 0) return "-";
  try {
    let best = history[0];
    let bestDate = new Date(history[0].Orderdate);
    for (let i = 1; i < history.length; i++) {
      const d = new Date(history[i].Orderdate);
      if (isNaN(d)) continue;
      if (isNaN(bestDate) || d > bestDate) {
        bestDate = d;
        best = history[i];
      }
    }
    return best && (best.Sales !== undefined && best.Sales !== null)
      ? best.Sales
      : "-";
  } catch (e) {
    console.error("getLatestSalesValue error", e);
    return "-";
  }
}

function formatPrice(p) {
  if (p === null || p === undefined || p === "") return "-";
  const n = Number(p);
  if (Number.isNaN(n)) return "-";
  return `₹ ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * ProductList component supports two views:
 * - "list"  (table)
 * - "cards" (card grid)
 *
 * Persist view choice in localStorage so it remains across reloads.
 */
export default function ProductList({ products, onEdit, onDelete, addProduct }) {
  const STORAGE_KEY = "bikri_view_mode_v1";
  const [viewMode, setViewMode] = useState("list"); // default 'list'
  const toggleBtnRef = useRef(null);

  // Read persisted mode before paint on client (reduces flash)
  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "list" || raw === "cards") {
        setViewMode(raw);
      }
    } catch (e) {
      // ignore
    }
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle and persist immediately
  const toggleView = () => {
    const newMode = viewMode === "list" ? "cards" : "list";
    setViewMode(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {
      // ignore
    }
    // remove focus so tooltip doesn't stick
    if (toggleBtnRef.current && typeof toggleBtnRef.current.blur === "function") {
      toggleBtnRef.current.blur();
    }
  };

  const GridIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  );

  const ListIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="2" rx="1" fill="currentColor" />
      <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
      <rect x="4" y="17" width="16" height="2" rx="1" fill="currentColor" />
    </svg>
  );

  return (
    <div className="productlist-card">
      {/* Header with title + toggle + add button */}
      <div className="productlist-header">
        <div className="productlist-info">
          <h2>Inventory</h2>
          <div className="small">Add and manage your products</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* View toggle (icon button) */}
          <div className="view-toggle" style={{ position: "relative" }}>
            <button
              ref={toggleBtnRef}
              className="icon-btn"
              onClick={toggleView}
              aria-pressed={viewMode === "cards"}
              aria-label={viewMode === "list" ? "Switch to card view" : "Switch to list view"}
            >
              <span className="icon" aria-hidden>
                {viewMode === "list" ? GridIcon : ListIcon}
              </span>
            </button>
            {/* tooltip shown on hover via CSS only */}
            <div className="view-toggle-tooltip" role="status" aria-hidden>
              {viewMode === "list" ? "Switch to Card View" : "Switch to List View"}
            </div>
          </div>

          {/* Add product button */}
          <button className="btn" onClick={addProduct}>
            + Add product
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <>
          {products.length === 0 ? (
            <p className="small">No products added yet. Click "+ Add product" to create one.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Last Sales</th>
                    <th>History</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td data-label="Product">{p.name}</td>
                      <td data-label="Category">{p.category}</td>
                      <td data-label="Price">{formatPrice(p.price)}</td>
                      <td data-label="Last Sales">{getLatestSalesValue(p.history)}</td>
                      <td data-label="History">{p.history ? p.history.length : 0}</td>
                      <td data-label="Actions">
                        <div className="flex">
                          <button className="btn secondary" onClick={() => onEdit(idx)}>
                            Edit
                          </button>
                          <button className="btn danger" onClick={() => onDelete(idx)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CARD VIEW */}
      {viewMode === "cards" && (
        <>
          {products.length === 0 ? (
            <p className="small">No products added yet. Click "+ Add product" to create one.</p>
          ) : (
            <div className="card-view-grid" aria-live="polite">
              {products.map((p, idx) => {
                const lastSales = getLatestSalesValue(p.history);
                return (
                  <div key={p.id || idx} className="product-card" tabIndex={-1}>
                    <div className="product-card-header">
                      <div>
                        <div className="product-card-title">{p.name}</div>
                        <div className="small">{p.category}</div>
                      </div>
                    </div>

                    <div className="product-card-body">
                      <div className="kv">
                        <div>Price</div>
                        <div style={{ fontWeight: 700 }}>{formatPrice(p.price)}</div>
                      </div>

                      <div className="kv" style={{ marginTop: 8 }}>
                        <div>Last Sales</div>
                        <div style={{ color: "var(--accent-dark)", fontWeight: 700 }}>{formatPrice(lastSales)}</div>
                      </div>

                      {p.city ? (
                        <div className="kv" style={{ marginTop: 8 }}>
                          <div>City</div>
                          <div style={{ fontWeight: 700 }}>{p.city}</div>
                        </div>
                      ) : null}

                      <div className="kv" style={{ marginTop: 8 }}>
                        <div>History Records</div>
                        <div style={{ display: "inline-block", padding: "4px 8px", borderRadius: 12, background: "#fff8f3", border: "1px solid #fff0e0" }}>
                          {p.history ? p.history.length : 0} entries
                        </div>
                      </div>
                    </div>

                    <div className="product-card-actions">
                      <button className="btn secondary" onClick={() => onEdit(idx)}>Edit</button>
                      <button className="btn danger" onClick={() => onDelete(idx)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
