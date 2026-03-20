import { useState } from "react";
import Layout from "../components/layout/Layout";
import { useProducts } from "../lib/hooks/useProducts";
import { usePredictions } from "../lib/hooks/usePredictions";
import { useAuth } from "../contexts/AuthContext";
import { predictSales } from "../lib/api";

/* ── helpers ────────────────────────────────────────────────── */
function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function rupees(n) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// accuracy = actual/predicted × 100. 100% = perfect.
// Color based on distance from 100%:
//   ±10  → green
//   ±25  → orange
//   else → red
function accuracyColor(acc) {
  if (acc == null) return "var(--text-muted)";
  const delta = Math.abs(acc - 100);
  if (delta <= 10) return "var(--success)";
  if (delta <= 25) return "var(--warning)";
  return "var(--error)";
}

function formatAccuracy(acc) {
  if (acc == null) return "—";
  return `${acc}%`;
}



const DATE_OPTIONS = [
  { label: "After 1 week", days: 7 },
  { label: "After 2 weeks", days: 14 },
  { label: "After 3 weeks", days: 21 },
  { label: "After 1 month", days: 30 },
  { label: "After 2 months", days: 60 },
  { label: "After 3 months", days: 90 },
  { label: "Custom date", days: null },
];

/* ── Result card ────────────────────────────────────────────── */
function ResultCard({ result, productName, price }) {
  const central = result.central ?? result.prediction;
  const lower = result.lower_bound;
  const upper = result.upper_bound;

  const units = price && price > 0 && central ? Math.floor(central / price) : null;

  const unitsLow = price && price > 0 ? Math.floor(lower / price) : null;
  const unitsHigh = price && price > 0 ? Math.floor(upper / price) : null;

  const estAcc    = result.estimated_accuracy;
  const accColor  = accuracyColor(estAcc);

  const spread = upper - lower;
  const spreadPct = central > 0 ? Math.round((spread / central) * 100) : null;

  return (
    <div className="card predict-result-card">
      {/* Header */}
      <div className="prc-header">
        <div>
          <p className="prc-product">{productName}</p>
          <p className="text-sm text-muted">
            Prediction for <strong>{result.prediction_date}</strong>
          </p>
        </div>
        {estAcc != null && (
          <div className="prc-accuracy-badge">
            <p className="prc-acc-label">Est. accuracy</p>
            <p className="prc-acc-value" style={{ color: accColor }}>
              {estAcc}%
            </p>
          </div>
        )}
      </div>

      {/* Central value */}
      <div className="prc-main">
        <p className="prc-value">{rupees(central)}</p>
        <p className="text-sm text-muted">predicted sales</p>
      </div>

      {/* Confidence range */}
      <div className="prc-range-wrap">
        <div className="prc-range-label">
          <div>
            <p className="text-xs text-muted">Lower bound</p>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
              {rupees(lower)}
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p className="text-xs text-muted">95% confidence</p>
            {spreadPct != null && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                ±{spreadPct}% spread
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="text-xs text-muted">Upper bound</p>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
              {rupees(upper)}
            </p>
          </div>
        </div>
        <div className="prc-range-bar" style={{ marginTop: 10 }}>
          <div className="prc-range-fill" />
        </div>
      </div>

      {/* Estimated units */}
      {units != null && (
        <div className="prc-units-row">
          <div className="prc-units-card">
            <p className="text-xs text-muted">Est. units (central)</p>
            <p
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: "var(--primary-darker)",
              }}
            >
              {units.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted">@ ₹{price} per unit</p>
          </div>
          {unitsLow != null && unitsHigh != null && (
            <div className="prc-units-range">
              <p className="text-xs text-muted" style={{ marginBottom: 4 }}>
                Unit range
              </p>
              <p style={{ fontWeight: 600, fontSize: 15 }}>
                {unitsLow.toLocaleString("en-IN")} —{" "}
                {unitsHigh.toLocaleString("en-IN")} units
              </p>
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="prc-meta-row">
        <div className="prc-meta-item">
          <p className="text-xs text-muted">Model</p>
          <p className="prc-meta-val">
            {result.model_status === "loaded" ? "Cached" : "Freshly trained"}
          </p>
        </div>
        <div className="prc-meta-item">
          <p className="text-xs text-muted">Trained on</p>
          <p className="prc-meta-val">{result.rows_used} rows</p>
        </div>
        {result.cv_rmse != null && (
          <div className="prc-meta-item">
            <p className="text-xs text-muted">CV RMSE</p>
            <p className="prc-meta-val">{result.cv_rmse}</p>
          </div>
        )}
        {result.uncertainty_pct != null && (
          <div className="prc-meta-item">
            <p className="text-xs text-muted">Uncertainty</p>
            <p className="prc-meta-val">{result.uncertainty_pct}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Accuracy legend ────────────────────────────────────────── */
function AccuracyLegend() {
  return (
    <div className="acc-legend">
      <span style={{ color: "var(--success)", fontWeight: 600 }}>
        ● 90–110%
      </span>
      <span className="text-muted">great</span>
      <span style={{ color: "var(--warning)", fontWeight: 600 }}>
        ● 75–125%
      </span>
      <span className="text-muted">ok</span>
      <span style={{ color: "var(--error)", fontWeight: 600 }}>
        ● outside
      </span>
    </div>
  );
}

/* ── Prediction history table ───────────────────────────────── */
function PredictionHistoryTable({ predictions, loading, onSetActual, onDelete }) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (!predictions.length) {
    return (
      <div className="pt-empty" style={{ padding: "32px 0" }}>
        <p className="text-muted">No predictions yet. Run your first prediction above.</p>
      </div>
    );
  }

  return (
    <>
      <AccuracyLegend />
      <div className="pt-table-wrap" style={{ marginTop: 12 }}>
        <table className="pt-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Date</th>
              <th>Predicted</th>
              <th>Actual</th>
              <th title="actual ÷ predicted × 100. 100% = perfect.">
                Accuracy
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((p) => {
              const acc   = p.accuracy;
              const color = accuracyColor(acc);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.productName}</td>
                  <td className="text-muted">{p.predictionDate}</td>
                  <td style={{ fontWeight: 600 }}>{rupees(p.predicted)}</td>
                  <td>
                    {p.actual != null ? (
                      <span style={{ color: "var(--success)", fontWeight: 600 }}>
                        {rupees(p.actual)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {acc != null ? (
                      <span style={{ fontWeight: 700, color }}>
                        {formatAccuracy(acc)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSetActual(p)}
                      >
                        {p.actual != null ? "Update actual" : "Set actual"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Set actual modal ───────────────────────────────────────── */
function SetActualModal({ prediction, onSave, onClose }) {
  // Pre-fill with existing actual if already set
  const [actual, setActual] = useState(prediction.actual ?? "");
  const [saving, setSaving] = useState(false);

    // Live preview of accuracy
  const preview = actual !== "" && !isNaN(Number(actual)) && prediction.predicted
    ? Math.round((Number(actual) / prediction.predicted) * 1000) / 10
    : null;

  async function handleSave() {
    const num = Number(actual);
    if (!actual || isNaN(num) || num < 0)
      return alert("Enter a valid sales amount.");
    setSaving(true);
    try {
      await onSave(prediction.id, num, prediction.predicted);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 420,
          width: "calc(100% - 32px)",
          padding: 24,
          margin: 16,
        }}
      >
        <h3 style={{ margin: "0 0 6px" }}>
          {prediction.actual != null
            ? "Update actual sales"
            : "Set actual sales"}
        </h3>
        <p className="text-sm text-muted" style={{ marginBottom: 20 }}>
          {prediction.productName} · {prediction.predictionDate}
        </p>
        {prediction.actual != null && (
          <div
            className="alert"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Current: {rupees(prediction.actual)} ·{" "}
            {formatAccuracy(prediction.accuracy)} accuracy
          </div>
        )}
        
        {/* Info about formula */}
        <div
          style={{
            background: "var(--primary-light)",
            border: "1px solid var(--primary-muted)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            fontSize: 12,
            color: "var(--primary-darker)",
            marginBottom: 16,
          }}
        >
          Accuracy = actual ÷ predicted × 100.&nbsp;<br />
          Over 100% means you sold more than predicted.
        </div>

        <div className="form-group" style={{ marginBottom: 8 }}>
          <label className="label">Actual sales (₹)</label>
          <input
            type="number"
            min="0"
            className="input"
            placeholder="e.g. 820"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            autoFocus
          />
        </div>

         {/* Live accuracy preview */}
        {/* {preview != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "var(--surface-2)",
              borderRadius: "var(--radius)",
              marginBottom: 20,
              fontSize: 13,
            }}
          >
            <span className="text-muted">Accuracy preview:</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: accuracyColor(preview) }}>
              {preview}%
            </span>
            <span className="text-muted" style={{ fontSize: 11 }}>
              (predicted: {rupees(prediction.predicted)})
            </span>
          </div>
        )} */}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner spinner-sm spinner-white" /> Saving…
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function Predict() {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const {
    predictions,
    loading: predsLoading,
    addPrediction,
    updatePrediction,
    deletePrediction,
  } = usePredictions();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [dateOpt, setDateOpt] = useState("30"); // days
  const [customDate, setCustomDate] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [resultProduct, setResultProduct] = useState(null);
  const [error, setError] = useState("");

  const [actualModal, setActualModal] = useState(null);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || null;

  function getTargetDate() {
    if (isCustom) return customDate;
    return addDays(Number(dateOpt));
  }

  async function handlePredict() {
    setError("");
    if (!selectedProductId) return setError("Please select a product.");
    if (!selectedProduct) return;
    const hist = selectedProduct.history || [];
    if (hist.length < 5)
      return setError(
        `Need at least 5 history entries. This product has ${hist.length}.`,
      );

    const targetDate = getTargetDate();
    if (!targetDate) return setError("Please choose a prediction date.");

    setPredicting(true);
    setResult(null);
    try {
      const data = await predictSales({
        uid: user.uid,
        productId: selectedProductId,
        predictDate: targetDate,
      });

      setResult(data);
      setResultProduct(selectedProduct);

      // Save to Firestore predictions
      await addPrediction({
        productId: selectedProductId,
        productName: selectedProduct.name,
        predictionDate: data.prediction_date,
        predicted: data.central ?? data.prediction,
        lowerBound: data.lower_bound,
        upperBound: data.upper_bound,
        actual: null,
        accuracy: null,
        price: selectedProduct.price,
      });
    } catch (err) {
      setError(
        err.message || "Prediction failed. Make sure the backend is running.",
      );
    } finally {
      setPredicting(false);
    }
  }

  async function handleSetActual(predId, actual, predicted) {
    // firestore.js calculates accuracy = actual/predicted × 100
    await updatePrediction(predId, { actual, predicted });

  }

  async function handleDelete(predId) {
    await deletePrediction(predId);
    if (result && predictions.find((p) => p.id === predId)) setResult(null);
  }

  return (
    <Layout title="Predict Sales">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── Predict form card ─────────────────────────────── */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 4px" }}>Predict Sales</h2>
          <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
            Select a product and date, then let the ML model forecast your
            sales.
          </p>

          <div className="predict-form-grid">
            {/* Product */}
            <div className="form-group predict-form-full">
              <label className="label">Product *</label>
              {productsLoading ? (
                <div style={{ padding: "10px 0" }}>
                  <span className="spinner spinner-sm" />
                </div>
              ) : (
                <select
                  className="select"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setResult(null);
                    setError("");
                  }}
                >
                  <option value="">— Select a product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.category ? ` · ${p.category}` : ""} (
                      {p.historyCount ?? (p.history || []).length} entries)
                    </option>
                  ))}
                </select>
              )}
              {selectedProduct &&
                (selectedProduct.historyCount ??
                  (selectedProduct.history || []).length) < 5 && (
                  <span className="field-error">
                    Need at least 5 history entries — currently{" "}
                    {selectedProduct.historyCount ??
                      (selectedProduct.history || []).length}
                    . Add more in Inventory.
                  </span>
                )}
            </div>

            {/* Date preset */}
            <div className="form-group">
              <label className="label">Predict for</label>
              <select
                className="select"
                value={isCustom ? "custom" : dateOpt}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustom(true);
                    setCustomDate(addDays(30));
                  } else {
                    setIsCustom(false);
                    setDateOpt(e.target.value);
                  }
                }}
              >
                {DATE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.days ?? "custom"}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom date (shown only when custom is selected) */}
            {isCustom && (
              <div className="form-group">
                <label className="label">Custom date</label>
                <input
                  type="date"
                  className="input"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Target date preview */}
          {!isCustom && (
            <p className="text-sm text-muted" style={{ marginTop: 8 }}>
              Target date: <strong>{getTargetDate()}</strong>
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}

          {/* Predict button */}
          <button
            className="btn btn-primary"
            style={{ marginTop: 20, minWidth: 160 }}
            onClick={handlePredict}
            disabled={predicting || !selectedProductId}
          >
            {predicting ? (
              <>
                <span className="spinner spinner-sm spinner-white" />{" "}
                Predicting…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 12h-4l-3 9L9 3l-3 9H2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Predict Sales
              </>
            )}
          </button>
        </div>

        {/* ── Result card ───────────────────────────────────── */}
        {result && resultProduct && (
          <ResultCard
            result={result}
            productName={resultProduct.name}
            price={resultProduct.price}
          />
        )}

        {/* ── Prediction history ────────────────────────────── */}
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Prediction History</h3>
              <p className="text-sm text-muted" style={{ marginTop: 3 }}>
                {predictions.length} prediction
                {predictions.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>

          <PredictionHistoryTable
            predictions={predictions}
            loading={predsLoading}
            onSetActual={(p) => setActualModal(p)}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Set actual modal */}
      {actualModal && (
        <SetActualModal
          prediction={actualModal}
          onSave={handleSetActual}
          onClose={() => setActualModal(null)}
        />
      )}
    </Layout>
  );
}
