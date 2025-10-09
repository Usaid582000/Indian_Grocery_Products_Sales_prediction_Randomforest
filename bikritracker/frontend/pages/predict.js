// frontend/pages/predict.js
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { loadProducts } from "../lib/storage";
import { predictSales } from "../lib/api";
import PredictionResult from "../components/PredictionResult";
import PredictionHistory from "../components/PredictionHistory";
import SetActualModal from "../components/SetActualModal";
import { loadPredictions, addPrediction, updatePrediction, deletePrediction } from "../lib/storage";

function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

export default function PredictPage(){
  const [products, setProducts] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [predictions, setPredictions] = useState([]);
  const [showActualModal, setShowActualModal] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);

  useEffect(()=> {
    setProducts(loadProducts());
    setPredictions(loadPredictions());
  }, []);

  const handlePredict = async () => {
    if(selectedIdx === "") return alert("Select a product");
    const p = products[selectedIdx];
    if(!p.history || p.history.length < 1) return alert("Add at least one history row to the product.");
    setLoading(true);
    try{
      const next = new Date(); next.setMonth(next.getMonth()+1);
      const predict_date = next.toISOString().split("T")[0];
      const resp = await predictSales({ product: {
        Category: p.category || "", Subcategory: p.subcategory || "", City: p.city || "", Region: p.region || ""
      }, history: p.history, predict_date });

      setResult(resp);

      // Add prediction to history (local)
      const predObj = {
        id: genId(),
        productName: p.name || `${p.category || ""} ${p.subcategory || ""}`.trim(),
        productIdx: selectedIdx,
        prediction_date: resp.prediction_date || predict_date,
        predicted: resp.prediction,
        actual: null,
        accuracy: null
      };
      const list = addPrediction(predObj);
      setPredictions(list);
    }catch(err){
      alert("Prediction failed: " + (err.message || err));
      console.error(err);
    }finally{ setLoading(false); }
  };

  const handleDeletePrediction = (id) => {
    if(!confirm("Delete this prediction from local history?")) return;
    const out = deletePrediction(id);
    setPredictions(out);
  };

  const handleRecordActual = (entry) => {
    setActiveEntry(entry);
    setShowActualModal(true);
  };

  const handleSaveActual = ({ actual, actual_date }) => {
    // update prediction entry with actual and compute accuracy
    const id = activeEntry.id;
    let accuracy = null;
    if(actual !== null && actual !== undefined && activeEntry.predicted !== null){
      if(actual === 0){
        accuracy = activeEntry.predicted === 0 ? 100 : 0;
      } else {
        const pctError = (Math.abs(activeEntry.predicted - actual) / (actual)) * 100;
        accuracy = Math.max(0, Math.round((100 - pctError) * 100) / 100); // two decimals
      }
    }
    const updates = {
      actual,
      actual_date,
      accuracy
    };
    const updated = updatePrediction(id, updates);
    setPredictions(updated);
    setActiveEntry(null);
  };

  return (
    <>
      <NavBar />
      <div className="container">
        <div className="card">
          <h2 style={{margin:0}}>Predict Sales</h2>
          <div className="small" style={{marginTop:8}}>Select one of your local products and click Predict. Local data is never uploaded permanently.</div>

          <div style={{marginTop:12}}>
            <select className="input" value={selectedIdx} onChange={(e)=>setSelectedIdx(e.target.value)}>
              <option value="">-- Select product --</option>
              {products.map((p,i)=>(<option key={p.id || i} value={i}>{p.name} — {p.category || ""}</option>))}
            </select>
          </div>

          <div style={{marginTop:12, display:'flex', gap:8}}>
            <button className="btn" onClick={handlePredict} disabled={loading}>{loading ? "Predicting..." : "Predict"}</button>
          </div>
        </div>

        {result && <div style={{marginTop:12}}><PredictionResult result={result} /></div>}

        <PredictionHistory
          predictions={predictions}
          onDelete={handleDeletePrediction}
          onRecordActual={handleRecordActual}
        />

        {showActualModal && activeEntry && (
          <SetActualModal
            entry={activeEntry}
            onClose={()=>{ setShowActualModal(false); setActiveEntry(null); }}
            onSave={handleSaveActual}
          />
        )}
      </div>
    </>
  );
}
