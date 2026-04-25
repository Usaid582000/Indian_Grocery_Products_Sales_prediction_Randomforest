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
  return `₹${Math.round(Number(n)).toLocaleString("en-IN")}`;
}

const CategoryIcon = ({ category }) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('grocery') || cat.includes('food')) return <span>🛒</span>;
  if (cat.includes('drink') || cat.includes('beverage')) return <span>🥤</span>;
  if (cat.includes('snack')) return <span>🍿</span>;
  if (cat.includes('electronic')) return <span>🔌</span>;
  if (cat.includes('accessory')) return <span>⌚</span>;
  if (cat.includes('clothing')) return <span>👕</span>;
  return <span>📦</span>;
};

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

  const units = price && price > 0 && central ? Math.round(central / price) : null;
  const estAcc = result.estimated_accuracy;

  return (
    <div className="m-card predict-result-premium">
      <div className="res-header">
        <div className="res-badge">PREDICTION RESULT</div>
        {estAcc != null && (
          <div className="res-acc">
            <span className="dot" /> {estAcc}% Confidence
          </div>
        )}
      </div>

      <div className="res-main">
        <h3 className="res-prod-name">{productName}</h3>
        <div className="res-val-group">
          <span className="res-currency">₹</span>
          <span className="res-amount">{Math.round(central).toLocaleString()}</span>
        </div>
        <p className="res-date">Expected by {result.prediction_date}</p>
      </div>

      <div className="res-stats-grid">
        <div className="res-stat-item">
          <span className="stat-label">Units (Est.)</span>
          <span className="stat-value">{units ? units.toLocaleString() : '—'}</span>
        </div>
        <div className="res-stat-item">
          <span className="stat-label">Lower Range</span>
          <span className="stat-value">₹{Math.round(lower).toLocaleString()}</span>
        </div>
        <div className="res-stat-item">
          <span className="stat-label">Upper Range</span>
          <span className="stat-value">₹{Math.round(upper).toLocaleString()}</span>
        </div>
      </div>

      <div className="res-footer-info">
        <div className="info-icon">💡</div>
        <p>This prediction is based on {result.rows_used} historical sales entries for this product.</p>
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
  const [dateOpt, setDateOpt] = useState("30"); 
  const [customDate, setCustomDate] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [resultProduct, setResultProduct] = useState(null);
  const [error, setError] = useState("");
  const [actualModal, setActualModal] = useState(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

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
      return setError(`Need at least 5 history entries. (Has ${hist.length})`);

    const targetDate = getTargetDate();
    if (!targetDate) return setError("Please choose a date.");

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
      setError(err.message || "Backend error.");
    } finally {
      setPredicting(false);
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <Layout title="Predict Sales">
      <div id="predict-override">
        <div className="new-predict">
          
          <div className="top-section">
            <div className="header-row">
              <div className="profile">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="avatar" />
                <span className="profile-name">Predict Demand</span>
              </div>
              <div className="date-pill">{currentDate}</div>
            </div>
            <h1 className="welcome-title">Sales Forecast</h1>
          </div>

          <div className="cards-container">
            
            <div className="m-card predict-form-premium">
              <h2 className="section-title">New Prediction</h2>
              
              <div className="v-form-group">
                <label className="v-label">Select Product</label>
                <div className="v-select-wrapper">
                  <select 
                    className="v-select"
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setResult(null);
                      setError("");
                    }}
                  >
                    <option value="">Choose a product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.historyCount || (p.history || []).length} entries)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="v-form-row">
                <div className="v-form-group flex-1">
                  <label className="v-label">Timeframe</label>
                  <select
                    className="v-select"
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

                {isCustom && (
                  <div className="v-form-group flex-1">
                    <label className="v-label">Specific Date</label>
                    <input
                      type="date"
                      className="v-input"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {error && <div className="v-error-pill">{error}</div>}

              <button 
                className="v-primary-btn"
                onClick={handlePredict}
                disabled={predicting || !selectedProductId}
              >
                {predicting ? "Analyzing Patterns..." : "Run AI Prediction →"}
              </button>
            </div>

            {result && resultProduct && (
              <ResultCard
                result={result}
                productName={resultProduct.name}
                price={resultProduct.price}
              />
            )}

            <div className="history-section">
              <h2 className="section-title">Recent History</h2>
              <div className="history-list">
                {predsLoading && <div className="loading-msg">Loading history...</div>}
                {!predsLoading && predictions.length === 0 && (
                  <div className="empty-msg">No recent predictions found.</div>
                )}
                {predictions.slice(0, 5).map(p => (
                  <div key={p.id} className="m-card history-item">
                    <div className="h-left">
                      <div className="h-icon">📈</div>
                      <div className="h-info">
                        <span className="h-name">{p.productName}</span>
                        <span className="h-date">{p.predictionDate}</span>
                      </div>
                    </div>
                    <div className="h-right">
                      <span className="h-val">₹{Math.round(p.predicted).toLocaleString()}</span>
                      <span className="h-label">Predicted</span>
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

        body:has(#predict-override) .app-main { padding: 0 !important; }
        body:has(#predict-override) .app-content { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
        
        .new-predict {
          background-color: #f7f5fa;
          min-height: 100vh;
          padding-bottom: 160px;
          font-family: 'Outfit', sans-serif;
        }

        .top-section {
          background: linear-gradient(135deg, #1f1d3c 0%, #28254c 100%);
          border-bottom-left-radius: 40px;
          border-bottom-right-radius: 40px;
          padding: 60px 24px 80px;
          color: white;
        }

        .header-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 30px;
        }
        .profile { display: flex; align-items: center; gap: 12px; }
        .profile img { width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); }
        .profile-name { font-weight: 700; font-size: 15px; }
        .date-pill {
          background: rgba(255,255,255,0.1);
          padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;
        }

        .welcome-title {
          font-size: 34px; font-weight: 800; margin: 0; line-height: 1.1;
          color: white;
        }

        .cards-container {
          padding: 0 20px; margin-top: -40px;
          display: flex; flex-direction: column; gap: 20px;
        }

        .m-card {
          background: white; border-radius: 32px; padding: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .section-title {
          font-size: 14px; font-weight: 800; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 1px;
          margin: 0 0 20px;
        }

        .v-form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .v-form-row { display: flex; gap: 12px; }
        .flex-1 { flex: 1; }
        .v-label { font-size: 13px; font-weight: 700; color: #1e1b4b; padding-left: 4px; }
        .v-select, .v-input {
          width: 100%; height: 56px; border-radius: 18px; border: 1.5px solid #f1f5f9;
          background: #f8fafc; padding: 0 16px; font-family: 'Outfit'; font-size: 15px;
          font-weight: 600; color: #1e1b4b; outline: none; transition: border-color 0.2s;
        }
        .v-select:focus, .v-input:focus { border-color: #6366f1; }

        .v-primary-btn {
          width: 100%; height: 60px; background: #1e1b4b; color: white; border: none;
          border-radius: 20px; font-size: 16px; font-weight: 800; cursor: pointer;
          margin-top: 10px; transition: all 0.2s;
        }
        .v-primary-btn:active { transform: scale(0.98); }
        .v-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .v-error-pill {
          background: #fff1f2; color: #e11d48; padding: 12px 16px; border-radius: 14px;
          font-size: 13px; font-weight: 600; margin-bottom: 16px; text-align: center;
        }

        /* Result Card Styles */
        .predict-result-premium {
          background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
          color: white; border: none;
        }
        .res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .res-badge {
          background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 10px;
          font-size: 11px; font-weight: 800; letter-spacing: 1px;
        }
        .res-acc { font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e; }
        
        .res-main { text-align: center; margin-bottom: 30px; }
        .res-prod-name { font-size: 18px; font-weight: 500; opacity: 0.9; margin: 0 0 8px; }
        .res-val-group { display: flex; align-items: flex-start; justify-content: center; gap: 4px; }
        .res-currency { font-size: 24px; font-weight: 800; margin-top: 8px; }
        .res-amount { font-size: 56px; font-weight: 800; line-height: 1; }
        .res-date { font-size: 13px; opacity: 0.7; margin: 12px 0 0; font-weight: 600; }

        .res-stats-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
          background: rgba(255,255,255,0.1); padding: 16px; border-radius: 20px;
        }
        .res-stat-item { display: flex; flex-direction: column; align-items: center; }
        .stat-label { font-size: 10px; font-weight: 700; opacity: 0.7; text-transform: uppercase; margin-bottom: 4px; }
        .stat-value { font-size: 14px; font-weight: 800; }

        .res-footer-info {
          margin-top: 24px; display: flex; gap: 12px; align-items: center;
          padding: 12px; background: rgba(0,0,0,0.1); border-radius: 16px;
        }
        .res-footer-info p { margin: 0; font-size: 11px; opacity: 0.8; font-weight: 500; line-height: 1.4; }

        /* History Section */
        .history-section { margin-top: 10px; }
        .history-list { display: flex; flex-direction: column; gap: 12px; }
        .history-item {
          padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
        }
        .h-left { display: flex; align-items: center; gap: 16px; }
        .h-icon {
          width: 44px; height: 44px; background: #f1f5f9; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .h-info { display: flex; flex-direction: column; }
        .h-name { font-size: 15px; font-weight: 700; color: #1e1b4b; }
        .h-date { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .h-right { text-align: right; }
        .h-val { display: block; font-size: 16px; font-weight: 800; color: #1e1b4b; }
        .h-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

        .loading-msg, .empty-msg { text-align: center; padding: 30px; color: #94a3b8; font-weight: 600; }
      `}</style>
    </Layout>
  );
}
