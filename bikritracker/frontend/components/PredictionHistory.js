// frontend/components/PredictionHistory.js
import React from "react";

export default function PredictionHistory({ predictions, onDelete, onRecordActual }) {
  return (
    <div className="productlist-card" style={{marginTop:12}}>
      <div className="productlist-header" style={{marginBottom:6}}>
        <div className="productlist-info">
          <h2>Prediction History</h2>
          <div className="small">Saved predictions (local only)</div>
        </div>
      </div>

      {predictions.length === 0 ? (
        <p className="small">No predictions yet. Run a prediction to add one.</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Date</th>
                <th>Predicted</th>
                <th>Actual</th>
                <th>Accuracy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((r) => (
                <tr key={r.id}>
                  <td data-label="Product">{r.productName}</td>
                  <td data-label="Date">{r.prediction_date || r.predict_date || "-"}</td>
                  <td data-label="Predicted">₹ {Number(r.predicted).toLocaleString()}</td>
                  <td data-label="Actual">{(r.actual === null || r.actual === undefined) ? "-" : `₹ ${Number(r.actual).toLocaleString()}`}</td>
                  <td data-label="Accuracy">{(r.accuracy === null || r.accuracy === undefined) ? "-" : `${r.accuracy}%`}</td>
                  <td data-label="Actions">
                    <div className="flex">
                      <button className="btn secondary" onClick={()=>onRecordActual(r)}>Record Actual</button>
                      <button className="btn danger" onClick={()=>onDelete(r.id)}>Delete</button>
                    </div>
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
