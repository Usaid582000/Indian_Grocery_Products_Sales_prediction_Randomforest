import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import ProductTable from '../components/inventory/ProductTable';
import ProductModal from '../components/inventory/ProductModal';
import VoiceProductModal from '../components/inventory/VoiceProductModal';
import ModalPortal from '../components/ui/ModalPortal';
import { useProducts } from '../lib/hooks/useProducts';

export default function Inventory() {
  const router = useRouter();
  const {
    products, loading, error,
    addProduct, updateProduct, deleteProduct,
  } = useProducts();

  // ── Core modal state ──────────────────────────────────────────
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);


  const [prefillSource, setPrefillSource] = useState(null); // 'voice' | 'template' | null

  // ── New: QR direct + Voice state ─────────────────────────────
  const [autoOpenQR,    setAutoOpenQR]    = useState(false);
  const [prefillData,   setPrefillData]   = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // ── Handle ?template= query from dashboard Best Selling ───────
  useEffect(() => {
    if (!router.isReady) return;
    const { template } = router.query;
    if (template) {
      try {
        const data = JSON.parse(decodeURIComponent(template));
        setEditing(null);
        setPrefillData(data);
        setPrefillSource('template');
        setAutoOpenQR(false);
        setShowModal(true);
        // Remove query param from URL without a reload
        router.replace('/inventory', undefined, { shallow: true });
      } catch (_) {}
    }
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
  }

  /** QR shortcut — open Add Product and immediately trigger scanner */
  function openQRDirect() {
    setEditing(null);
    setPrefillData(null);
    setAutoOpenQR(true);
    setShowModal(true);
  }

  /** Voice shortcut — open voice modal first */
  function openVoiceInput() {
    setShowVoiceModal(true);
  }

  /** Called when voice modal finishes — open ProductModal with pre-filled fields */
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
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Layout title="Inventory">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ────────────────────────────────────── */}
        <div className="inv-page-header">
          <div>
            <h2 style={{ margin: 0 }}>Your Products</h2>
            <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>
              {loading
                ? 'Loading…'
                : `${products.length} product${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Desktop-only action buttons (hidden on mobile via CSS) */}
          <div className="inv-header-actions">
            <div className="inv-header-quick-btns">
              <button
                className="btn btn-secondary"
                onClick={openVoiceInput}
                title="Add a product using your voice"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3"
                    stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Voice Input
              </button>
              <button
                className="btn btn-secondary"
                onClick={openQRDirect}
                title="Scan a barcode or QR code to add a product"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3"  y="3"  width="7" height="7" rx="1"
                    stroke="currentColor" strokeWidth="1.8"/>
                  <rect x="14" y="3"  width="7" height="7" rx="1"
                    stroke="currentColor" strokeWidth="1.8"/>
                  <rect x="3"  y="14" width="7" height="7" rx="1"
                    stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3M14 21h3M20 18v3"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Scan Product
              </button>
            </div>

            <button className="btn btn-primary" onClick={openAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              Add product
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Products table */}
        <div className="card" style={{ padding: 20 }}>
          <ProductTable
            products={products}
            loading={loading}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </div>

        {/* ── Mobile-only quick actions (below the card) ─────── */}
        <div className="inv-quick-actions">
          <button
            className="btn btn-secondary inv-quick-btn"
            onClick={openQRDirect}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3"  y="3"  width="7" height="7" rx="1"
                stroke="currentColor" strokeWidth="1.8"/>
              <rect x="14" y="3"  width="7" height="7" rx="1"
                stroke="currentColor" strokeWidth="1.8"/>
              <rect x="3"  y="14" width="7" height="7" rx="1"
                stroke="currentColor" strokeWidth="1.8"/>
              <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3M14 21h3M20 18v3"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Scan Product
          </button>
          <button
            className="btn btn-secondary inv-quick-btn"
            onClick={openVoiceInput}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3"
                stroke="currentColor" strokeWidth="1.8"/>
              <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Voice Input
          </button>
        </div>

      </div>

      {/* ── Product modal ─────────────────────────────────────── */}
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

      {/* ── Voice modal ───────────────────────────────────────── */}
      {showVoiceModal && (
        <VoiceProductModal
          onProceed={handleVoiceDone}
          onClose={() => setShowVoiceModal(false)}
        />
      )}

      {/* ── Delete confirmation ───────────────────────────────── */}
      {deleteTarget && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
            }}
          >
            <div className="confirm-dialog card">
              <div className="confirm-dialog-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"
                    stroke="var(--error)" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 8px' }}>Delete product?</h3>
              <p className="text-muted" style={{ fontSize: 14, marginBottom: 20 }}>
                <strong>{deleteTarget.name}</strong> and all its sales history
                will be permanently deleted. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? <><span className="spinner spinner-sm" style={{ borderTopColor: 'var(--error)' }} /> Deleting…</>
                    : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </Layout>
  );
}