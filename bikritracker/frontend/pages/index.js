// frontend/pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // load static templates JSON (public/popular_templates.json)
    fetch("/popular_templates.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setTemplates([]));
  }, []);

  // utility to create an encoded template param
  const encodeTemplateParam = (obj) => encodeURIComponent(JSON.stringify(obj));

  return (
    <>
      <NavBar />
      <div className="container">
        <div className="hero centered-hero">
          <div className="hero-inner card">

            <div className="hero-body">
              <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto" }}>
                <h1 className="hero-headline">
                  Make <span className="gradient-text">smarter</span> decisions with <span className="gradient-text">accurate</span> sales predictions
                </h1>
                <p className="small" style={{ marginTop: 10 }}>
                  Transform your grocery business with AI-powered sales forecasting.
                  Predict future sales, manage inventory efficiently, and maximize profits.
                </p>

                <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 12 }}>
                  <Link href="/inventory"><button className="btn hero-cta">Manage Inventory</button></Link>
                  <Link href="/predict"><button className="btn secondary">Predict Sales</button></Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section style={{ marginTop: 18 }}>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Best Selling <span className="gradient-text">Products</span></h2>
            <p className="small">Track performance of most popular inventory items</p>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              {templates.length === 0 ? (
                <div className="small">No templates available. Run the generator script to create templates.</div>
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

                  <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                    {/* Add button: goes to /inventory with template in query param */}
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

        <section style={{ marginTop: 18 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Why BikriTracker</h3>
            <div className="small">Powerful features designed specifically for shopkeepers to optimize inventory and boost profits.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginTop: 12 }}>
              <div className="card small">Fast predictions — one-click forecasting from your sales history.</div>
              <div className="card small">Local-first — your data is stored in your browser.</div>
              <div className="card small">Price-aware guidance — estimated units & stock planning.</div>
              <div className="card small">Simple no-setup UI — get started in minutes.</div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
