// frontend/components/PredictionResult.js
export default function PredictionResult({ result }) {
  if(!result) return null;

  const predDate = result.prediction_date || result.predict_date || null;

  return (
    <div className="card center" style={{flexDirection:'column',gap:12}}>
      <h3>Prediction Result</h3>

      <div style={{textAlign:'center'}}>
        <div className="result-big">₹ {Number(result.prediction).toLocaleString()}</div>
        <div className="result-range">Range: ₹ {Number(result.lower_bound).toLocaleString()} — ₹ {Number(result.upper_bound).toLocaleString()}</div>
        <div className="prediction-date small" style={{marginTop:8}}>
          {predDate ? `For: ${predDate}` : "For: (unknown date)"}
        </div>
      </div>
    </div>
  );
}
