// frontend/pages/predict.js
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

// helper to compute date offset
function addDaysToDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
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

  // new state for dropdown
  const [dateOption, setDateOption] = useState("1month");

  useEffect(() => {
    setProducts(loadProducts());
    setPredictions(loadPredictions());
    setSelectedDate(defaultNextMonthDateISO());
  }, []);

  const handleDateOptionChange = (value) => {
    setDateOption(value);
    switch (value) {
      case "1week":
        setSelectedDate(addDaysToDate(7));
        break;
      case "2week":
        setSelectedDate(addDaysToDate(14));
        break;
      case "3week":
        setSelectedDate(addDaysToDate(21));
        break;
      case "1month":
        setSelectedDate(addDaysToDate(30));
        break;
      case "2month":
        setSelectedDate(addDaysToDate(60));
        break;
      case "3month":
        setSelectedDate(addDaysToDate(90));
        break;
      case "custom":
        // keep current selectedDate until user changes it
        break;
      default:
        setSelectedDate(defaultNextMonthDateISO());
    }
  };

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
          City: p.city || "",      // product may not have city; backend accepts empty
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
        price: p.price || null,   // store price locally to compute units
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
          (Math.abs(activeEntry.predicted - actual) / (actual || 1)) * 100;
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

  // compute the selected product's price for passing to PredictionResult
  const selectedProduct = selectedIdx === "" ? null : products[selectedIdx];
  const selectedPrice = selectedProduct ? (selectedProduct.price || null) : null;

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

          <div
            className="form-inline"
            style={{ marginTop: 12, alignItems: "center" }}
          >
            {/* Product Selector */}
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

            {/* Date Selection Dropdown */}
            <div className="date-field" style={{ minWidth: 170 }}>
              <label className="kv" style={{ display: "block", marginBottom: 6 }}>
                Prediction for:
              </label>
              <select
                className="input"
                value={dateOption}
                onChange={(e) => handleDateOptionChange(e.target.value)}
              >
                <option value="1week">After 1 week</option>
                <option value="2week">After 2 weeks</option>
                <option value="3week">After 3 weeks</option>
                <option value="1month">After 1 month</option>
                <option value="2month">After 2 months</option>
                <option value="3month">After 3 months</option>
                <option value="custom">Custom date</option>
              </select>
            </div>

            {/* Show date picker only if custom */}
            {dateOption === "custom" && (
              <div className="date-field" style={{ minWidth: 170 }}>
                <br />
                <input
                  type="date"
                  className="input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}
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
            <PredictionResult result={result} price={selectedPrice} />
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
