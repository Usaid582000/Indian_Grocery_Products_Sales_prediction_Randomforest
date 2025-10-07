// pages/predict.js
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { loadProducts } from "../lib/storage";
import { predictSales } from "../lib/api";
import PredictionResult from "../components/PredictionResult";

export default function PredictPage(){
  const [products, setProducts] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(()=> setProducts(loadProducts()), []);

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
    }catch(err){
      alert("Prediction failed: " + (err.message || err));
      console.error(err);
    }finally{ setLoading(false); }
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
      </div>
    </>
  );
}
