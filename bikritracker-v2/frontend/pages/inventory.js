import { useState } from 'react';
import Layout from '../components/layout/Layout';
import ProductTable from '../components/inventory/ProductTable';
import ProductModal from '../components/inventory/ProductModal';
import ModalPortal  from '../components/ui/ModalPortal';
import { useProducts } from '../lib/hooks/useProducts';

export default function Inventory() {
  const {
    products, loading, error,
    addProduct, updateProduct, deleteProduct,
  } = useProducts();

  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  function openAdd() {
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(product) {
    setEditing(product);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditing(null);
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

        {/* Page header */}
        <div className="inv-page-header">
          <div>
            <h2 style={{ margin: 0 }}>Your Products</h2>
            <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>
              {loading
                ? 'Loading…'
                : `${products.length} product${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            Add product
          </button>
        </div>

        {/* Error */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Products */}
        <div className="card" style={{ padding: 20 }}>
          <ProductTable
            products={products}
            loading={loading}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </div>

      </div>

      {/* Product modal — has its own Portal internally */}
      {showModal && (
        <ProductModal
          product={editing}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* Delete confirmation — wrapped in Portal */}
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