// pages/predict.js
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { loadProducts } from "../lib/storage";
import { predictSales } from "../lib/api";
import PredictionResult from "../components/PredictionResult";
import PredictionHistory from "../components/PredictionHistory";
import SetActualModal from "../components/SetActualModal";
import {
  loadPredictions,
  addOrUpdatePrediction,
  updatePrediction,
  deletePrediction,
} from "../lib/storage";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultNextMonthDateISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export default function PredictPage() {
  const [products, setProducts] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState("");
  const [selectedDate, setSelectedDate] = useState(defaultNextMonthDateISO());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [predictions, setPredictions] = useState([]);
  const [showActualModal, setShowActualModal] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);

  useEffect(() => {
    setProducts(loadProducts());
    setPredictions(loadPredictions());
    setSelectedDate(defaultNextMonthDateISO());
  }, []);

  const handlePredict = async () => {
    if (selectedIdx === "") return alert("Select a product");
    const p = products[selectedIdx];
    if (!p.history || p.history.length < 1)
      return alert("Add at least one history row to the product.");
    if (!selectedDate) return alert("Please choose a prediction date.");

    setLoading(true);
    try {
      const predict_date = selectedDate;
      const resp = await predictSales({
        product: {
          Category: p.category || "",
          Subcategory: p.subcategory || "",
          City: p.city || "",
          Region: p.region || "",
        },
        history: p.history,
        predict_date,
      });

      // display backend response
      setResult(resp);

      // Add or update prediction in local history (unique by productName + date)
      const predObj = {
        id: genId(),
        productName:
          p.name || `${p.category || ""} ${p.subcategory || ""}`.trim(),
        productIdx: selectedIdx,
        prediction_date: resp.prediction_date || predict_date,
        predicted: resp.prediction,
        actual: null,
        accuracy: null,
      };

      const list = addOrUpdatePrediction(predObj);
      setPredictions(list);
    } catch (err) {
      alert("Prediction failed: " + (err.message || err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrediction = (id) => {
    if (!confirm("Delete this prediction?")) return;
    const out = deletePrediction(id);
    setPredictions(out);
  };

  const handleRecordActual = (entry) => {
    setActiveEntry(entry);
    setShowActualModal(true);
  };

  const handleSaveActual = ({ actual, actual_date }) => {
    const id = activeEntry.id;
    let accuracy = null;
    if (
      actual !== null &&
      actual !== undefined &&
      activeEntry.predicted !== null &&
      activeEntry.predicted !== undefined
    ) {
      if (actual === 0) {
        accuracy = activeEntry.predicted === 0 ? 100 : 0;
      } else {
        const pctError =
          Math.abs(activeEntry.predicted - actual) / (actual || 1) * 100;
        accuracy = Math.max(0, Math.round((100 - pctError) * 100) / 100);
      }
    }
    const updates = {
      actual,
      actual_date,
      accuracy,
    };
    const updated = updatePrediction(id, updates);
    setPredictions(updated);
    setActiveEntry(null);
    setShowActualModal(false);
  };

  return (
    <>
      <NavBar />
      <div className="container">
        <div className="card">
          <h2 style={{ margin: 0 }}>Predict Sales</h2>
          <div className="small" style={{ marginTop: 8 }}>
            Select one of your local products, pick the date you want to predict
            for, then click Predict.
          </div>

          {/* inline form: select, date, button */}
          <div
            className="form-inline"
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <div style={{ flex: "1 1 320px", minWidth: 180 }}>
              <select
                className="input"
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(e.target.value)}
              >
                <option value="">-- Select product --</option>
                {products.map((p, i) => (
                  <option key={p.id || i} value={i}>
                    {p.name} — {p.category || ""}
                  </option>
                ))}
              </select>
            </div>
            <br />
            <div className="date-field" style={{ minWidth: 170 }}>
              <label className="kv" style={{ display: "block", marginBottom: 6 }}>
                Prediction date (Default: Next Month)
              </label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <br />

            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                className="btn predict-btn"
                onClick={handlePredict}
                disabled={loading}
              >
                {loading ? "Predicting..." : "Predict"}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div style={{ marginTop: 12 }}>
            <PredictionResult result={result} />
          </div>
        )}

        <PredictionHistory
          predictions={predictions}
          onDelete={handleDeletePrediction}
          onRecordActual={handleRecordActual}
        />

        {showActualModal && activeEntry && (
          <SetActualModal
            entry={activeEntry}
            onClose={() => {
              setShowActualModal(false);
              setActiveEntry(null);
            }}
            onSave={handleSaveActual}
          />
        )}
      </div>
    </>
  );
}
