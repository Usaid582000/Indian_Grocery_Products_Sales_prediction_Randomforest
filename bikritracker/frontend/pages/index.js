import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";

/**
 * AreaChartCard
 * - Uses Catmull-Rom -> Bezier conversion to produce a smooth path that passes through data points.
 * - Data points (markers) use the same computed coordinates, so markers align exactly on the curve.
 * - Area fill is drawn from the bottom to the curve and back.
 *
 * data: [{ label: 'Jul', v: 50 }, ...]
 */
function AreaChartCard({ data = [], title = "Accuracy Over Time" }) {
  const width = 420;
  const height = 240;
  const padding = 28;
  const minY = 0;
  const maxY = 100;

  if (!data || data.length === 0) return null;

  const xFor = (i) => {
    if (data.length === 1) return padding + (width - padding * 2) / 2;
    return padding + (i / (data.length - 1)) * (width - padding * 2);
  };

  const yFor = (v) => {
    const frac = (v - minY) / (maxY - minY || 1);
    return padding + (1 - frac) * (height - padding * 2);
  };

  // Build list of points
  const pts = data.map((d, i) => ({ x: xFor(i), y: yFor(d.v) }));

  // Catmull-Rom to cubic Bezier conversion.
  // Returns a path string that goes through every pts[i]
  const buildCatmullRomPath = (points) => {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    const n = points.length;

    for (let i = 0; i < n - 1; i++) {
      const p0 = i - 1 >= 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 2 < n ? points[i + 2] : p2;

      // control points
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = buildCatmullRomPath(pts);

  // smooth area fill (follows the curve, not just straight lines)
  const areaPath = (() => {
    if (pts.length < 2) return "";
    const bottomY = height - padding;
    let d = `M ${pts[0].x} ${bottomY} L ${pts[0].x} ${pts[0].y}`;
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = i - 1 >= 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i + 2 < n ? pts[i + 2] : p2;

      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${bottomY} Z`;
    return d;
  })();

  return (
    <div className="card accuracy-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div className="small" style={{ marginTop: 6 }}>Model accuracy progression over time</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet">
          {/* horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const yy = padding + f * (height - padding * 2);
            return <line key={i} x1={padding} x2={width - padding} y1={yy} y2={yy} stroke="#f3f2f1" strokeWidth="1" />;
          })}

          {/* area fill + subtle shadow */}
          {areaPath && <path d={areaPath} fill="rgba(249,115,22,0.12)" stroke="none" />}
          {areaPath && <path d={areaPath} fill="rgba(249,115,22,0.06)" stroke="none" transform="translate(0,6)" />}

          {/* smooth line that passes through actual data points */}
          {linePath && <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}

          {/* markers exactly at data points */}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.8" fill="#fff" stroke="#f97316" strokeWidth="1.6" />
          ))}

          {/* x labels */}
          {data.map((d, i) => {
            const tx = xFor(i);
            return <text key={i} x={tx} y={height - 8} fontSize="11" textAnchor="middle" fill="#666">{d.label}</text>;
          })}

          {/* y labels */}
          {[0, 25, 50, 75, 100].map((v, i) => {
            const yy = yFor(v);
            return <text key={i} x={8} y={yy + 4} fontSize="11" fill="#999">{v}%</text>;
          })}
        </svg>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card card" style={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="feature-icon">{icon}</div>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div className="small" style={{ marginTop: 6 }}>{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const router = useRouter();
  const leftHeroRef = useRef(null);
  const rightHeroRef = useRef(null);

  useLayoutEffect(() => {
  const sync = () => {
    if ((leftHeroRef.current && rightHeroRef.current) && window.innerWidth > 920) {
      leftHeroRef.current.style.height = rightHeroRef.current.offsetHeight + 'px';
    }
  };
  sync();
  window.addEventListener('resize', sync);
  return () => window.removeEventListener('resize', sync);
  }, [templates]);


  useEffect(() => {
    fetch("/popular_templates.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setTemplates([]));
  }, []);

  const encodeTemplateParam = (obj) => encodeURIComponent(JSON.stringify(obj));

  const features = [
    {
      title: "Smart Forecasting",
      desc: "AI-powered predictions for your inventory with 85%+ accuracy.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 17h4v4H3zM10 11h4v10h-4zM17 7h4v14h-4z" fill="#fff" />
        </svg>
      )
    },
    {
      title: "Track Trends",
      desc: "Monitor sales patterns and make data-driven decisions.",
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M6 14l3-6 5 4 4-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "Inventory Management",
      desc: "Keep track of all products with detailed history.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 7h18v4H3zM5 11v8h14v-8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "Accurate Predictions",
      desc: "Get precise sales forecasts for any future date.",
      icon: (
        // circular 3-ring target icon
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="6" stroke="#fff" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="1.2" />
        </svg>
      )
    }
  ];

  // small curved progression but passes through points thanks to Catmull-Rom -> Bezier
  const accuracyData = [
    { label: "Jul", v: 50 },
    { label: "Aug", v: 86 },
    { label: "Sep", v: 76 },
    { label: "Oct", v: 94 },
  ];

  return (
    <>
      <NavBar />
      <div className="container">
        {/* HERO - left (content) and right (chart) */}
        <div className="hero" style={{ alignItems: "flex-start" }}>
          <div ref={leftHeroRef} className="hero-left card" style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between", // evenly spaced items
            padding: 22
          }}>
            <div>            
              <h1 className="hero-headline">
              Make <span style={{ background: "linear-gradient(90deg,#c2410c,#f97316)", WebkitBackgroundClip: "text", color: "transparent" }}>smarter</span> decisions with <span style={{ background: "linear-gradient(90deg,#c2410c,#f97316)", WebkitBackgroundClip: "text", color: "transparent" }}>accurate</span> sales predictions
            </h1>

            <p className="small" style={{ marginTop: 12, lineHeight: 1.6 }}>
              Transform your grocery business with AI-powered sales forecasting.
              Predict future sales, manage inventory efficiently, and maximize profits.
            </p>
            </div>

            <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
              <Link href="/inventory"><button className="btn">Start Forecasting</button></Link>
              <Link href="/predict"><button className="btn secondary">View Predictions</button></Link>
            </div>
          </div>

          {/* responsive chart container: maxWidth keeps desktop layout but allows mobile stacking */}
          <div ref={rightHeroRef} style={{ width: "100%", maxWidth: 460 }}>
            <AreaChartCard data={accuracyData} title="Accuracy Over Time" />
          </div>
        </div>

        {/* Best selling templates */}
        <section style={{ marginTop: 26 }}>
          <div className="card" style={{ padding: 18 }}>
            <h2>Best Selling <span style={{ background: "linear-gradient(90deg,#c2410c,#f97316)", WebkitBackgroundClip: "text", color: "transparent" }}>Products</span></h2>
            <p className="small">Track performance of most popular inventory items</p>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              {templates.length === 0 ? (
                <div className="small">No templates available.</div>
              ) : templates.map((t, i) => (
                <div key={i} className="template-card">
                  <div className="template-head">
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      <div className="small">{t.category}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: "#c2410c" }}>₹ {Number(t.price).toLocaleString()}</div>
                  </div>
                  <div className="small" style={{ marginTop: 8 }}>{t.sample_note}</div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <Link href={{
                      pathname: "/inventory",
                      query: { template: encodeTemplateParam(t) }
                    }}>
                      <button className="btn">Add</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ marginTop: 26 }}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>
              Why Choose <span style={{ background: "linear-gradient(90deg,#c2410c,#f97316)", WebkitBackgroundClip: "text", color: "transparent" }}>BikriTracker</span>?
            </h2>
            <div className="small" style={{ marginTop: 8 }}>
              Powerful features designed specifically for shopkeepers to optimize inventory and boost profits.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            {features.map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer" style={{ marginTop: 32 }}>
          © {new Date().getFullYear()} BikriTracker. All rights reserved.
        </footer>
      </div>
    </>
  );
}
