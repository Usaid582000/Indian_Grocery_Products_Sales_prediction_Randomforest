import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

/* ── Scroll-reveal hook ─────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ── Animated counter ───────────────────────────────────── */
function Counter({ end, suffix = '' }) {
  const spanRef = useRef(null);
  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let start = 0;
      const step = Math.ceil(end / 40);
      const tick = () => {
        start = Math.min(start + step, end);
        el.textContent = start.toLocaleString() + suffix;
        if (start < end) requestAnimationFrame(tick);
      };
      tick();
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [end, suffix]);
  return <span ref={spanRef}>0{suffix}</span>;
}

export default function Home() {
  const rootRef = useReveal();

  /* Navbar scroll effect */
  useEffect(() => {
    const nav = document.getElementById('landing-nav');
    if (!nav) return;
    const handler = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <Head>
        <title>BikriTracker | AI Sales Forecasting for Kirana Stores</title>
        <meta name="description" content="Stop guessing what to stock. BikriTracker uses AI to forecast demand for your Indian grocery store." />
      </Head>

      <div ref={rootRef} style={{ fontFamily: 'Inter, sans-serif', backgroundColor: 'var(--bg-darkpurple)', color: 'var(--text-light)' }}>

        {/* ── Navbar ────────────────────────────────────── */}
        <nav id="landing-nav" className="landing-nav">
          <div className="landing-nav-brand">
            <img src="/favicon.png" alt="BikriTracker Logo" width="32" height="32" style={{ objectFit: 'contain' }} />
            <span>BikriTracker</span>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login">
              <button className="btn btn-secondary btn-sm">Log In</button>
            </Link>
            <Link href="/dashboard">
              <button className="btn btn-primary btn-sm">Get Started</button>
            </Link>
          </div>
        </nav>

        {/* ── Hero ──────────────────────────────────────── */}
        <section className="landing-hero">
          {/* Animated background orbs */}
          <div className="hero-bg">
            <div className="hero-bg-orb" />
            <div className="hero-bg-orb" />
            <div className="hero-bg-orb" />
          </div>

          {/* Floating grocery icons */}
          <div className="floating-icons">
            {['🛒', '🥦', '🍅', '📊', '🧂', '🫒', '📦', '🌶️'].map((icon, i) => (
              <span key={i} className="float-icon">{icon}</span>
            ))}
          </div>

          <div className="hero-content">
            <div className="hero-pill reveal">
              <span className="hero-pill-dot" />
              AI-Powered Forecasting
            </div>

            <h1 className="hero-title reveal" style={{ transitionDelay: '0.1s' }}>
              Know What Your Store<br />
              <span className="accent">Will Sell Tomorrow</span>
            </h1>

            <p className="hero-sub reveal" style={{ transitionDelay: '0.2s' }}>
              Your kirana store deserves smarter inventory. BikriTracker learns from your sales data and predicts demand, so you never overstock or understock again.
            </p>

            <div className="hero-actions reveal" style={{ transitionDelay: '0.3s' }}>
              <Link href="/dashboard">
                <button className="btn btn-primary btn-lg" style={{ boxShadow: '0 8px 24px rgba(109,129,150,0.35)' }}>
                  Start Predicting - Free
                </button>
              </Link>
              <Link href="#how">
                <button className="btn btn-secondary btn-lg">
                  How It Works ↓
                </button>
              </Link>
            </div>
          </div>

          <div className="scroll-hint">
            <span>Scroll</span>
            <div className="scroll-hint-line" />
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────── */}
        <div className="stat-row reveal">
          <div className="stat-item">
            <div className="stat-num"><Counter end={95} suffix="%" /></div>
            <div className="stat-label">Forecast accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-num"><Counter end={500} suffix="+" /></div>
            <div className="stat-label">Products tracked</div>
          </div>
          <div className="stat-item">
            <div className="stat-num"><Counter end={30} suffix="%" /></div>
            <div className="stat-label">Waste reduced</div>
          </div>
        </div>

        {/* ── Chart / Forecast Section ──────────────────── */}
        <section className="chart-section">
          <div className="chart-section-inner">
            <div className="chart-text reveal-left">
              <h2>See the Future of Your Sales</h2>
              <p>
                Upload your past data. Our Random Forest model learns seasonal trends, festival spikes, and buying patterns unique to your store — then shows you what's coming next.
              </p>
              <div className="chart-labels">
                <span className="chart-label">
                  <span className="chart-label-dot" style={{ background: 'var(--primary)' }} /> Actual Sales
                </span>
                <span className="chart-label">
                  <span className="chart-label-dot" style={{ background: '#22c55e' }} /> Predicted
                </span>
              </div>
            </div>

            <div className="chart-visual reveal-right">
              <div className="chart-svg-wrap">
                <svg viewBox="0 0 400 200" width="100%" height="100%" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[40, 80, 120, 160].map(y => (
                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
                  ))}
                  {/* Actual sales */}
                  <polyline
                    className="chart-line-actual"
                    points="0,160 40,140 80,120 120,135 160,100 200,110 240,80 280,90"
                  />
                  {/* Predicted (dashed, continues forward) */}
                  <polyline
                    className="chart-line-predicted"
                    points="280,90 320,70 360,55 400,60"
                    strokeDasharray="6 4"
                  />
                  {/* Confidence band */}
                  <polygon
                    points="280,80 320,58 360,42 400,46 400,74 360,68 320,82 280,100"
                    fill="#22c55e"
                    opacity="0.08"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────── */}
        <section className="features-section">
          <div className="features-header reveal">
            <h2>Everything Your Store Needs</h2>
            <p>Built for single-owner kirana stores. Simple, powerful, no complexity.</p>
          </div>

          <div className="features-grid stagger">
            {[
              { icon: '📈', bg: 'rgba(34,197,94,0.12)', title: 'Demand Forecasting', desc: 'ML-powered predictions learn your store\'s unique sales patterns week over week.' },
              { icon: '📦', bg: 'rgba(109,129,150,0.12)', title: 'Inventory Insights', desc: 'Know exactly which products to reorder and when — no more spoilage or stockouts.' },
              { icon: '🏷️', bg: 'rgba(245,158,11,0.12)', title: 'Category Tracking', desc: 'Track beverages, snacks, oil, masala, dairy and more — all organized automatically.' },
              { icon: '📊', bg: 'rgba(59,130,246,0.12)', title: 'Visual Dashboard', desc: 'Clean charts and trend lines that make sense at a glance. No data science needed.' },
              { icon: '📤', bg: 'rgba(168,85,247,0.12)', title: 'CSV Upload', desc: 'Just upload your sales spreadsheet. BikriTracker handles the rest.' },
              { icon: '🔒', bg: 'rgba(239,68,68,0.12)', title: 'Your Data, Private', desc: 'One account, one store. Your data is yours and never shared with anyone.' },
            ].map((f, i) => (
              <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────── */}
        <section id="how" className="steps-section">
          <div className="steps-inner">
            <div className="steps-header reveal">
              <h2>Three Steps to Smarter Stocking</h2>
              <p>No setup headaches. Get forecasts in minutes.</p>
            </div>

            <div className="steps-list">
              {[
                { num: '1', title: 'Upload Your Sales Data', desc: 'Export your past sales as a CSV and drop it into BikriTracker.' },
                { num: '2', title: 'AI Learns Your Patterns', desc: 'Our Random Forest model finds trends, seasonality, and product-level demand signals.' },
                { num: '3', title: 'Get Predictions', desc: 'See forecasted demand per product so you can order the right quantities every time.' },
              ].map((s, i) => (
                <div key={i} className="step-item reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                  <div className="step-num">{s.num}</div>
                  <div className="step-body">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <section className="cta-section">
          <div className="cta-card reveal-scale">
            <h2>Stop Guessing. Start Predicting.</h2>
            <p>Join kirana store owners who are already saving money with data-driven inventory.</p>
            <Link href="/dashboard">
              <button className="btn btn-primary btn-lg" style={{ background: '#fff', color: 'var(--text)', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                Get Started — It's Free
              </button>
            </Link>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────── */}
        <footer className="landing-footer">
          <span>© 2026 BikriTracker. Built for Kirana.</span>
          <span>Made By Team5</span>
          <span>AI-powered grocery forecasting</span>
        </footer>

      </div>
    </>
  );
}
