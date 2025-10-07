// components/PredictionResult.js
export default function PredictionResult({ result }) {
  if(!result) return null;

  const hist = result.historical_accuracy || null;

  // compute accuracy percent if metric is SMAPE or MAPE
  let accuracyText = "N/A";
  if(hist){
    if(hist.accuracy !== undefined && hist.accuracy !== null){
      accuracyText = `${hist.accuracy}%`;
    } else if(hist.metric && (hist.metric.toUpperCase()==="SMAPE" || hist.metric.toUpperCase()==="MAPE") && typeof hist.value === "number"){
      const acc = Math.max(0, Math.round((100 - hist.value) * 100) / 100); // round 2 decimals
      accuracyText = `${acc}%`;
    }
  }

  return (
    <div className="card center" style={{flexDirection:'column',gap:12}}>
      <h3>Prediction Result</h3>

      <div style={{textAlign:'center'}}>
        <div className="result-big">₹ {Number(result.prediction).toLocaleString()}</div>
        <div className="result-range">Range: ₹ {Number(result.lower_bound).toLocaleString()} — ₹ {Number(result.upper_bound).toLocaleString()}</div>
        <div className="small" style={{marginTop:8}}>
          Accuracy: {accuracyText}
        </div>
      </div>
    </div>
  );
}
