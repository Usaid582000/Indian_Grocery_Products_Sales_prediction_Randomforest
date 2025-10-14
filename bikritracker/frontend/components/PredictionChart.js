// frontend/components/PredictionChart.js
import React, { useMemo } from "react";

/**
 * PredictionChart
 * props:
 *  - predictions: array of { prediction_date, predicted, actual }
 *  - width, height (optional)
 *
 * The chart plots time (x) vs value (y). It draws two lines:
 * - Actual (solid)
 * - Predicted (dashed)
 */
export default function PredictionChart({ predictions = [], width = 900, height = 220 }) {
  // transform predictions into time-series points
  const pts = useMemo(() => {
    const rows = (predictions || [])
      .map(r => {
        const date = r.prediction_date || r.predict_date || r.actual_date || null;
        const dt = date ? new Date(date) : null;
        return {
          t: dt ? dt.getTime() : null,
          dateStr: date,
          predicted: typeof r.predicted === "number" ? r.predicted : (r.predicted ? Number(r.predicted) : null),
          actual: typeof r.actual === "number" ? r.actual : (r.actual ? Number(r.actual) : null),
        };
      })
      .filter(r => r.t !== null)
      .sort((a,b) => a.t - b.t);
    return rows;
  }, [predictions]);

  if (!pts || pts.length === 0) {
    return <div className="card small">No prediction history to show yet.</div>;
  }

  // build x/y scale
  const times = pts.map(p => p.t);
  const allValues = pts.reduce((acc, p) => {
    if (p.predicted != null) acc.push(p.predicted);
    if (p.actual != null) acc.push(p.actual);
    return acc;
  }, []);
  if (allValues.length === 0) {
    return <div className="card small">No numeric values to plot.</div>;
  }

  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const viewW = width;
  const viewH = height;
  const pad = 28;

  const x = (t) => {
    if (maxT === minT) return pad + (viewW - pad * 2) / 2;
    return pad + ((t - minT) / (maxT - minT)) * (viewW - pad * 2);
  };
  const y = (v) => {
    if (maxY === minY) return pad + (viewH - pad * 2) / 2;
    // invert y axis: larger values -> smaller y coordinate
    return pad + (1 - (v - minY) / (maxY - minY)) * (viewH - pad * 2);
  };

  // prepare line strings
  const makePath = (arr, selector) => {
    const pts2 = arr.map(p => ({ x: x(p.t), y: (p[selector] != null ? y(p[selector]) : null), raw: p }));
    const valid = pts2.filter(p => p.y !== null);
    if (!valid.length) return "";
    return valid.map((p, i) => `${i===0?"M":"L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  };

  const predictedPath = makePath(pts, "predicted");
  const actualPath = makePath(pts, "actual");

  // ticks on x: pick months or dates
  const xTicks = pts.map(p => ({ t: p.t, label: new Date(p.t).toLocaleDateString(undefined, { month: "short", year: "numeric" }) }));
  // reduce duplicates
  const uniqXTicks = xTicks.filter((v,i,self) => i===self.findIndex(s=>s.label===v.label));

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Sales Trend</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 12, height: 8, background: "#f97316", borderRadius: 2 }} /> Actual
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="16" height="8"><line x1="0" x2="16" y1="4" y2="4" stroke="#c2410c" strokeDasharray="4 4" strokeWidth="2"/></svg> Predicted
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* background grid horizontal lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const yy = pad + f * (viewH - pad*2);
          return <line key={i} x1={pad} x2={viewW-pad} y1={yy} y2={yy} stroke="#eee" strokeWidth="1" />;
        })}

        {/* actual (solid) */}
        {actualPath && <path d={actualPath} stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}

        {/* predicted (dashed) */}
        {predictedPath && <path d={predictedPath} stroke="#c2410c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />}

        {/* points */}
        {pts.map((p, idx) => {
          const cx = x(p.t);
          const actualY = (p.actual != null) ? y(p.actual) : null;
          const predY = (p.predicted != null) ? y(p.predicted) : null;
          return (
            <g key={idx}>
              {actualY !== null && <circle cx={cx} cy={actualY} r="3.5" fill="#fff" stroke="#f97316" strokeWidth="1.5" />}
              {predY !== null && <rect x={cx-3.5} y={predY-3.5} width="7" height="7" rx="1.5" fill="#fff" stroke="#c2410c" strokeWidth="1.5" />}
            </g>
          );
        })}

        {/* x axis labels */}
        {uniqXTicks.map((t, i) => {
          const tx = x(t.t);
          return <text key={i} x={tx} y={viewH - 6} fontSize="11" textAnchor="middle" fill="#666">{t.label}</text>;
        })}

      </svg>
    </div>
  );
}
