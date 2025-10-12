// frontend/components/PredictionResult.js
export default function PredictionResult({ result, price }) {
  if(!result) return null;

  const predDate = result.prediction_date || result.predict_date || null;
  const priceNum = price ? Number(price) : null;
  const units = (priceNum && priceNum > 0 && result && result.prediction)
    ? Math.floor(Number(result.prediction) / priceNum)
    : null;

  return (
    <div className="card center" style={{flexDirection:'column',gap:12}}>
      <h3>Prediction Result</h3>

      <div style={{textAlign:'center', width: '100%'}}>
        <div className="result-big">₹ {Number(result.prediction).toLocaleString()}</div>

        <div className="result-range" style={{marginTop:8}}>
          Range: ₹ {Number(result.lower_bound).toLocaleString()} — ₹ {Number(result.upper_bound).toLocaleString()}
        </div>

        <div className="prediction-date small" style={{marginTop:8}}>
          {predDate ? `For: ${predDate}` : "For: (unknown date)"}
        </div>

        {units !== null && (
          <div style={{marginTop:10}}>
            <div style={{
              display:'inline-block',
              background:'#fff7f0',
              border: '1px solid #ffe0c7',
              padding: '8px 12px',
              borderRadius: 10,
              fontWeight:700,
              color: '#c2410c'
            }}>
              Estimated units (based on price): {units.toLocaleString()} items
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
