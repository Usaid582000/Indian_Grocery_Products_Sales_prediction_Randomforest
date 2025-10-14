// frontend/components/NavBar.js
import Link from "next/link";
import { useRouter } from "next/router";


function IconBox() {
  // small inline logo/icon (keeps no external deps)
  return (
    <div className="hero-logo">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect rx="8" width="24" height="24" fill="#FFEDD5" />
        <path d="M6 14l3-6 5 4 4-6" stroke="#F97316" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  );
}

export default function NavBar(){
  const router = useRouter();
  return (
    <header className="header container">
      <div className="brand">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconBox />
          <div>
            <div className="title">BikriTracker</div>
            <div className="small">Sales forecasting for shopkeepers</div>
          </div>
        </div>
      </div>

      <nav className="nav">
        <Link href="/"><button className={router.pathname === "/" ? "active" : ""}>Home</button></Link>
        <Link href="/inventory"><button className={router.pathname === "/inventory" ? "active" : ""}>Inventory</button></Link>
        <Link href="/predict"><button className={router.pathname === "/predict" ? "active" : ""}>Predict</button></Link>
      </nav>
    </header>
  );
}
