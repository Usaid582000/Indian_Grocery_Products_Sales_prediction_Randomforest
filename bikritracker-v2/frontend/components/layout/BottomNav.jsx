import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BottomNav({ onAccountClick }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = (e) => {
    e.preventDefault();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleAccountsClick = (e) => {
    if (onAccountClick) {
      e.preventDefault();
      onAccountClick();
    }
  };

  return (
    <nav className="bottom-nav-modern">
      {/* Floating Add Product Menu */}
      {isMenuOpen && (
        <div className="fab-popup-menu">
          <Link href="/inventory?action=scan" className="popup-item" onClick={closeMenu}>
            <div className="popup-icon">📷</div>
            <span>Scan Bar/QR Code</span>
          </Link>
          <Link href="/inventory?action=voice" className="popup-item" onClick={closeMenu}>
            <div className="popup-icon">🎙️</div>
            <span>Voice Input</span>
          </Link>
          <Link href="/inventory?action=manual" className="popup-item" onClick={closeMenu}>
            <div className="popup-icon">⌨️</div>
            <span>Type Manually</span>
          </Link>
          <div className="popup-arrow"></div>
        </div>
      )}

      <div className="nav-container">
        <div className="nav-group">
          <Link href="/dashboard" className={`nav-item ${router.pathname === '/dashboard' ? 'active' : ''}`}>
            <div className="icon-wrapper dashboard-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="7" height="9" rx="2" />
                <rect x="13" y="4" width="7" height="5" rx="2" />
                <rect x="4" y="15" width="7" height="5" rx="2" />
                <rect x="13" y="11" width="7" height="9" rx="2" />
              </svg>
            </div>
            <span>Dashboard</span>
          </Link>
          
          <Link href="/inventory" className={`nav-item ${router.pathname === '/inventory' ? 'active' : ''}`}>
            <div className="icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8H3V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z" />
                <path d="M16 12H8" />
                <path d="M16 8V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
              </svg>
            </div>
            <span>Inventory</span>
          </Link>
        </div>
        
        <div className="nav-center">
          <button className="fab-button" onClick={toggleMenu} style={{ border: 'none', cursor: 'pointer', outline: 'none' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" style={{ transform: isMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </button>
          <span className="fab-label">Add Product</span>
        </div>

        <div className="nav-group">
          <Link href="/predict" className={`nav-item ${router.pathname === '/predict' ? 'active' : ''}`}>
            <div className="icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18l6-6 4 4 8-8" />
                <circle cx="16" cy="18" r="4" />
                <path d="M19 21l2 2" />
              </svg>
            </div>
            <span>Prediction</span>
          </Link>
          
          <div className="nav-item" onClick={handleAccountsClick}>
            <div className="icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6h-4z" />
              </svg>
            </div>
            <span>Accounts</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        .fab-popup-menu {
          position: absolute;
          bottom: 110px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border-radius: 28px;
          box-shadow: 0 15px 50px rgba(0,0,0,0.15);
          width: 240px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 10001;
          pointer-events: auto;
          font-family: 'Outfit', sans-serif;
          animation: slideUpFab 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUpFab {
          from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        .popup-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 18px;
          text-decoration: none;
          color: #1e1b4b;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .popup-item:hover {
          background: #f1f5f9;
          transform: translateX(4px);
          text-decoration: none !important;
        }

        .popup-icon {
          width: 32px; height: 32px; background: #f8fafc; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }

        .popup-arrow {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 16px;
          height: 16px;
          background: white;
        }
      `}</style>
    </nav>
  );
}