// frontend/components/SetActualModal.js
import { useState, useEffect } from "react";

export default function SetActualModal({ entry, onClose, onSave }) {
  // entry contains id, predicted, prediction_date, productName, ...
  const [actual, setActual] = useState(entry?.actual ?? "");
  const [date, setDate] = useState(entry?.prediction_date ?? "");

  useEffect(()=>{
    setActual(entry?.actual ?? "");
    setDate(entry?.prediction_date ?? "");
  }, [entry]);

  const handleSave = () => {
    const a = Number(actual);
    if(isNaN(a) || a < 0) return alert("Enter a valid non-negative number for actual sales.");
    onSave({ actual: a, actual_date: date || entry.prediction_date });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e)=>{ if(e.target.className==='modal-backdrop') onClose(); }}>
      <div className="modal">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom:8}}>
          <h3>Record actual sales</h3>
          <div className="small">{entry.productName}</div>
        </div>

        <div className="stacked-row">
          <div>
            <label className="kv">Actual sales (₹)</label>
            <input className="input" type="number" value={actual} onChange={(e)=>setActual(e.target.value)} />
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
            <button className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={handleSave}>Save actual</button>
          </div>
        </div>
      </div>
    </div>
  );
}
