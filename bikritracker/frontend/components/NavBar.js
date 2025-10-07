// components/NavBar.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function NavBar(){
  const router = useRouter();
  return (
    <header className="header container">
      <div className="brand">
        <div>
          <div className="title">BikriTracker</div>
          <div className="small">Sales forecasting for shopkeepers</div>
        </div>
      </div>

      <nav className="nav">
        <Link href="/inventory"><button className={router.pathname === "/inventory" ? "active" : ""}>Inventory</button></Link>
        <Link href="/predict"><button className={router.pathname === "/predict" ? "active" : ""}>Predict</button></Link>
      </nav>
    </header>
  );
}
