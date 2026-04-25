import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import ProductModal from '../components/inventory/ProductModal';
import VoiceProductModal from '../components/inventory/VoiceProductModal';
import ModalPortal from '../components/ui/ModalPortal';
import { useProducts } from '../lib/hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';

const CategoryIcon = ({ category }) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('grocery') || cat.includes('food')) return <span style={{ fontSize: 24 }}>🛒</span>;
  if (cat.includes('drink') || cat.includes('beverage')) return <span style={{ fontSize: 24 }}>🥤</span>;
  if (cat.includes('snack')) return <span style={{ fontSize: 24 }}>🍿</span>;
  if (cat.includes('electronic')) return <span style={{ fontSize: 24 }}>🔌</span>;
  if (cat.includes('accessory')) return <span style={{ fontSize: 24 }}>⌚</span>;
  if (cat.includes('clothing')) return <span style={{ fontSize: 24 }}>👕</span>;
  return <span style={{ fontSize: 24 }}>📦</span>;
};

export default function Inventory() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    products, loading, error,
    addProduct, updateProduct, deleteProduct,
  } = useProducts();

  // ── Core state ──────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [swipedId, setSwipedId] = useState(null);
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'price-asc', 'price-desc'
  const [showFilters, setShowFilters] = useState(false);

  const [prefillSource, setPrefillSource] = useState(null);
  const [autoOpenQR, setAutoOpenQR] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // ── Handle Action Query from BottomNav ────────────────────────
  useEffect(() => {
    if (!router.isReady) return;
    const { action } = router.query;
    if (action === 'scan') openQRDirect();
    if (action === 'voice') openVoiceInput();
    if (action === 'manual') openAdd();

    if (action) router.replace('/inventory', undefined, { shallow: true });
  }, [router.isReady, router.query]);

  // ── Handlers ──────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setPrefillData(null);
    setAutoOpenQR(false);
    setShowModal(true);
  }

  function openEdit(product) {
    setEditing(product);
    setPrefillData(null);
    setAutoOpenQR(false);
    setShowModal(true);
    setSwipedId(null);
  }

  function openQRDirect() {
    setEditing(null);
    setPrefillData(null);
    setAutoOpenQR(true);
    setShowModal(true);
  }

  function openVoiceInput() {
    setShowVoiceModal(true);
  }

  function handleVoiceDone(parsedFields) {
    setShowVoiceModal(false);
    setEditing(null);
    setPrefillData(parsedFields);
    setPrefillSource('voice');
    setAutoOpenQR(false);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditing(null);
    setAutoOpenQR(false);
    setPrefillData(null);
    setPrefillSource(null);
  }

  async function handleSave(formData) {
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing.id, formData);
      } else {
        await addProduct(formData);
      }
      closeModal();
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      setSwipedId(null);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }

  const processedProducts = useMemo(() => {
    let result = [...products];

    // Filter
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt?.seconds * 1000 || 0) - new Date(a.createdAt?.seconds * 1000 || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt?.seconds * 1000 || 0) - new Date(b.createdAt?.seconds * 1000 || 0);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

    return result;
  }, [products, searchQuery, sortBy]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  function handleViewAll() {
    setSearchQuery('');
    setSortBy('latest');
    setShowFilters(false);
  }

  return (
    <Layout title="Inventory">
      <div id="inventory-override" className="inventory-page">
        <div className="new-inv">

          {/* Top Section */}
          <div className="top-section">
            <div className="header-row">
              <div className="profile">
                <img src={user?.photoURL || "https://i.pravatar.cc/150?u=a042581f4e29026024d"} alt="avatar" />
                <span className="profile-name">{user?.displayName || 'Sharma General Store'}</span>
              </div>
              <div className="date-pill">{currentDate}</div>
            </div>
            <h1 className="welcome-title">Inventory</h1>

            <div className="search-container">
              <div className="search-bar">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className={`filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-8h6m2 10h6" />
                  </svg>
                </button>
              </div>

              {showFilters && (
                <div className="filters-dropdown">
                  <div className="filter-group">
                    <span className="filter-label">Sort By</span>
                    <div className="filter-options">
                      <button className={sortBy === 'latest' ? 'selected' : ''} onClick={() => { setSortBy('latest'); setShowFilters(false); }}>Latest</button>
                      <button className={sortBy === 'oldest' ? 'selected' : ''} onClick={() => { setSortBy('oldest'); setShowFilters(false); }}>Oldest</button>
                      <button className={sortBy === 'price-asc' ? 'selected' : ''} onClick={() => { setSortBy('price-asc'); setShowFilters(false); }}>Price Low-High</button>
                      <button className={sortBy === 'price-desc' ? 'selected' : ''} onClick={() => { setSortBy('price-desc'); setShowFilters(false); }}>Price High-Low</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="cards-container">
            <div className="items-header">
              <h2 className="section-title">Items</h2>
              <button className="view-all" onClick={handleViewAll}>View All</button>
            </div>

            <div className="product-list">
              {loading && <div className="loading-state">Loading inventory...</div>}
              {!loading && processedProducts.length === 0 && (
                <div className="empty-state">No products found.</div>
              )}
              {processedProducts.map((p) => (
                <div key={p.id} className="product-card-container">
                  <div className={`action-reveal ${swipedId === p.id ? 'visible' : ''}`}>
                    <button className="reveal-btn edit" onClick={() => openEdit(p)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      <span>Edit</span>
                    </button>
                    <button className="reveal-btn delete" onClick={() => setDeleteTarget(p)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6m4-11v6" /></svg>
                      <span>Delete</span>
                    </button>
                  </div>

                  <div
                    className={`product-card ${swipedId === p.id ? 'swiped' : ''}`}
                    onClick={() => setSwipedId(swipedId === p.id ? null : p.id)}
                  >
                    <div className="card-main">
                      <div className="product-img-box">
                        <CategoryIcon category={p.category} />
                      </div>
                      <div className="product-info">
                        <div className="product-name-row">
                          <span className="p-name">{p.name}</span>
                          <span className="p-cat">{p.category || 'General'}</span>
                        </div>
                        <div className="p-stock">{p.historyCount || 0} in Stock</div>
                      </div>
                      <div className="product-price">
                        ₹{p.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────── */}
      {showModal && (
        <ProductModal
          product={editing}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          autoOpenQR={autoOpenQR}
          prefillData={prefillData}
          prefillSource={prefillSource}
        />
      )}

      {showVoiceModal && (
        <VoiceProductModal
          onProceed={handleVoiceDone}
          onClose={() => setShowVoiceModal(false)}
        />
      )}

      {deleteTarget && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
            <div className="confirm-dialog card">
              <div className="confirm-dialog-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" stroke="var(--error)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Delete product?</h3>
              <p className="text-muted"><strong>{deleteTarget.name}</strong> will be permanently deleted.</p>
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        body:has(#inventory-override) .app-main { padding: 0 !important; margin: 0 !important; }
        body:has(#inventory-override) .app-content { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
        
        .new-inv {
          background-color: #f7f5fa;
          min-height: 100vh;
          padding-bottom: 140px;
          font-family: 'Outfit', sans-serif;
        }

        .top-section {
          background: linear-gradient(145deg, #1f1d3c 0%, #28254c 100%);
          border-bottom-left-radius: 40px;
          border-bottom-right-radius: 40px;
          padding: 60px 24px 100px;
          color: white;
          position: relative;
        }

        .header-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 32px;
        }
        .profile { display: flex; align-items: center; gap: 12px; }
        .profile img { width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); }
        .profile-name { font-size: 17px; font-weight: 500; }
        .date-pill { background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 20px; font-size: 13px; }

        .welcome-title { font-size: 34px; font-weight: 700; text-align: center; margin: 0 0 32px; color: #fff !important; }

        .search-container {
          position: absolute;
          bottom: -28px; left: 24px; right: 24px;
          z-index: 100;
        }
        .search-bar {
          background: white;
          border-radius: 20px;
          height: 56px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        .search-icon { color: #94a3b8; margin-right: 12px; }
        .search-bar input {
          flex: 1; border: none; outline: none; font-size: 16px; font-family: 'Outfit'; color: #1e1b4b;
        }
        .filter-btn {
          background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; color: #475569;
          transition: all 0.2s;
        }
        .filter-btn.active { background: #1e1b4b; color: white; }

        .filters-dropdown {
          position: absolute;
          top: 68px; left: 0; right: 0;
          background: white; border-radius: 20px; padding: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          animation: slideDown 0.2s ease-out;
          z-index: 200;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .filter-group { display: flex; flex-direction: column; gap: 8px; }
        .filter-label { font-size: 13px; font-weight: 600; color: #94a3b8; }
        .filter-options { display: flex; flex-wrap: wrap; gap: 8px; }
        .filter-options button {
          padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: white; color: #475569; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .filter-options button.selected { background: #1e1b4b; color: white; border-color: #1e1b4b; }

        .cards-container { padding: 50px 24px 24px; }
        .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-title { font-size: 18px; font-weight: 700; color: #1e1b4b; margin: 0; }
        .view-all { background: none; border: none; color: #64748b; font-weight: 600; font-size: 14px; cursor: pointer; }

        .product-list { display: flex; flex-direction: column; gap: 16px; }
        
        .product-card-container {
          position: relative;
          background: transparent;
          border-radius: 24px;
        }

        .action-reveal {
          position: absolute; top: 0; right: 0; bottom: 0;
          width: 160px;
          display: flex;
          opacity: 0; visibility: hidden;
          transition: all 0.2s;
          z-index: 1;
        }
        .action-reveal.visible { opacity: 1; visibility: visible; }

        .reveal-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          border: none; color: white; gap: 4px; font-size: 11px; font-weight: 600;
          cursor: pointer;
        }
        .reveal-btn.edit { background: #6366f1; border-top-left-radius: 0; border-bottom-left-radius: 0; }
        .reveal-btn.delete { background: #ef4444; border-top-right-radius: 24px; border-bottom-right-radius: 24px; }

        .product-card {
          position: relative;
          background: white; border-radius: 24px; padding: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
          cursor: pointer;
        }
        .product-card.swiped { transform: translateX(-160px); }

        .card-main { display: flex; align-items: center; gap: 16px; }
        
        .product-img-box {
          width: 64px; height: 64px; background: #f8fafc; border-radius: 18px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .product-info { flex: 1; }
        .product-name-row { display: flex; flex-direction: column; margin-bottom: 2px; }
        .p-name { font-size: 15px; font-weight: 700; color: #1e1b4b; }
        .p-cat { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .p-stock { font-size: 13px; font-weight: 600; color: #64748b; margin-top: 2px; }

        .product-price { font-size: 17px; font-weight: 800; color: #1e1b4b; margin-right: 4px; }

        .dialog-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
        .empty-state, .loading-state { text-align: center; padding: 40px; color: #94a3b8; font-weight: 500; }

        .confirm-dialog {
          background: white; border-radius: 28px; padding: 32px;
          width: 90%; max-width: 400px; text-align: center;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: modalSlideUp 0.3s ease-out;
        }
        .confirm-dialog-icon {
          width: 64px; height: 64px; background: #fee2e2; border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px; color: #ef4444;
        }
        .confirm-dialog h3 { font-size: 22px; font-weight: 700; color: #1e1b4b; margin: 0 0 12px; }
        .confirm-dialog p { font-size: 15px; color: #64748b; line-height: 1.5; margin-bottom: 30px; }
      `}</style>
    </Layout>
  );
}