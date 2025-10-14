// frontend/components/PredictionChart.js
import React, { useMemo } from "react";

/**
 * PredictionChart (Accuracy over time)
 * - Expects predictions array where entries may have { prediction_date, accuracy }
 * - Plots accuracy (%) on y (0..100) across time on x.
 * - If there are 2 or fewer accuracy points, shows a friendly message.
 *
 * props:
 *  - predictions: array of { prediction_date, accuracy, ... }
 *  - width, height (optional) - used for viewBox; SVG is responsive
 */
export default function PredictionChart({ predictions = [], width = 900, height = 220 }) {
  // Extract rows that have numeric accuracy and a date
  const pts = useMemo(() => {
    if (!Array.isArray(predictions)) return [];
    return predictions
      .map((r) => {
        const date = r.prediction_date || r.predict_date || r.actual_date || null;
        const dt = date ? new Date(date) : null;
        const t = dt ? dt.getTime() : null;
        const acc =
          r.accuracy !== undefined && r.accuracy !== null && !Number.isNaN(Number(r.accuracy))
            ? Number(r.accuracy)
            : null;
        return t !== null && acc !== null ? { t, acc, dateStr: date } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.t - b.t);
  }, [predictions]);

  // If not enough accuracy points -> show message
  if (!pts || pts.length === 0) {
    return <div className="card small">No accuracy history available yet.</div>;
  }
  if (pts.length <= 2) {
    return <div className="card small">Not enough accuracy history to chart — need at least 3 completed records.</div>;
  }

  // Chart dimensions and padding
  const viewW = width;
  const viewH = height;
  const pad = 32;
  const minY = 0;
  const maxY = 100;

  const minT = Math.min(...pts.map((p) => p.t));
  const maxT = Math.max(...pts.map((p) => p.t));

  const xFor = (t) => {
    if (maxT === minT) return pad + (viewW - pad * 2) / 2;
    return pad + ((t - minT) / (maxT - minT)) * (viewW - pad * 2);
  };

  const yFor = (v) => {
    // clamp between 0 and 100 just in case, and map to pixel space
    const vv = Math.max(minY, Math.min(maxY, v));
    const frac = (vv - minY) / (maxY - minY || 1);
    return pad + (1 - frac) * (viewH - pad * 2);
  };

  // Build coords array
  const coords = pts.map((p) => ({ x: xFor(p.t), y: yFor(p.acc), acc: Math.max(minY, Math.min(maxY, p.acc)), t: p.t }));

  // Build straight polyline path (no smoothing) - this avoids overshoot issues.
  const buildLinearPath = (points) => {
    if (!points.length) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  };

  const linePath = buildLinearPath(coords);

  // Area path: from bottom-left to each point and back to bottom-right, closed.
  const buildAreaPath = (points) => {
    if (!points.length) return "";
    const bottomY = viewH - pad;
    const startX = points[0].x.toFixed(2);
    const segment = points.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L ");
    const lastX = points[points.length - 1].x.toFixed(2);
    return `M ${startX} ${bottomY.toFixed(2)} L ${segment} L ${lastX} ${bottomY.toFixed(2)} Z`;
  };

  const areaPath = buildAreaPath(coords);

  // X ticks - use unique month labels similar to previous behavior
  const xTicksRaw = pts.map((p) => ({ t: p.t, label: new Date(p.t).toLocaleDateString(undefined, { month: "short", year: "numeric" }) }));
  const uniqXTicks = xTicksRaw.filter((v, i, self) => i === self.findIndex(s => s.label === v.label));

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Prediction Accuracy History</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Showing accuracy (%) for records with actuals
        </div>
      </div>

      <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* horizontal grid (0..100) */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const yy = pad + f * (viewH - pad * 2);
          return <line key={i} x1={pad} x2={viewW - pad} y1={yy} y2={yy} stroke="#f3f2f1" strokeWidth="1" />;
        })}

        {/* area fill behind line (matches straight path exactly) */}
        {areaPath && <path d={areaPath} fill="rgba(249,115,22,0.10)" stroke="none" />}
        {areaPath && <path d={areaPath} fill="rgba(249,115,22,0.06)" stroke="none" transform="translate(0,6)" />}

        {/* main straight line */}
        {linePath && <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}

        {/* markers */}
        {coords.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.8" fill="#fff" stroke="#f97316" strokeWidth="1.6" />
          </g>
        ))}

        {/* x labels */}
        {uniqXTicks.map((t, i) => {
          const tx = xFor(t.t);
          return <text key={i} x={tx} y={viewH - 8} fontSize="11" textAnchor="middle" fill="#666">{t.label}</text>;
        })}

        {/* y labels 0..100 step 25 */}
        {[0, 25, 50, 75, 100].map((v, i) => {
          const yy = yFor(v);
          return <text key={i} x={8} y={yy + 4} fontSize="11" fill="#999">{v}%</text>;
        })}
      </svg>
    </div>
  );
}
