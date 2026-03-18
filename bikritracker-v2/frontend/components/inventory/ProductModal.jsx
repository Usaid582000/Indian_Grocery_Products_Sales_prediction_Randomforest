import { useState, useEffect } from 'react';
import ModalPortal from '../ui/ModalPortal';
import SalesHistoryTable from './SalesHistoryTable';
import VoiceInputButton  from './VoiceInputButton';
import QRScannerModal    from './QRScannerModal';

const CATEGORIES = [
  'Beverages', 'Snacks', 'Bakery', 'Oil & Masala', 'Dairy',
  'Grains & Pulses', 'Personal Care', 'Household', 'Fresh Produce',
  'Confectionery', 'Spices', 'Instant Foods', 'Frozen Foods',
];

const SUBCATEGORIES = {
  'Beverages':       ['Health Drinks', 'Soft Drinks', 'Tea', 'Coffee', 'Juices', 'Water'],
  'Snacks':          ['Cookies', 'Noodles', 'Namkeen', 'Chips', 'Popcorn', 'Crackers'],
  'Bakery':          ['Breads & Buns', 'Cakes', 'Biscuits', 'Rusk', 'Muffins'],
  'Oil & Masala':    ['Masalas', 'Cooking Oil', 'Ghee', 'Sauces', 'Vinegar'],
  'Dairy':           ['Milk', 'Butter', 'Cheese', 'Paneer', 'Yogurt', 'Cream'],
  'Grains & Pulses': ['Rice', 'Wheat', 'Dal', 'Flour', 'Semolina', 'Oats'],
  'Personal Care':   ['Soap', 'Shampoo', 'Toothpaste', 'Face Wash', 'Moisturizer'],
  'Household':       ['Detergent', 'Dishwash', 'Cleaners', 'Air Freshener'],
  'Confectionery':   ['Chocolates', 'Candies', 'Gums', 'Mints'],
  'Spices':          ['Salt', 'Pepper', 'Turmeric', 'Cumin', 'Coriander'],
  'Instant Foods':   ['Instant Noodles', 'Ready Meals', 'Soup Mixes', 'Pasta'],
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyForm() {
  return {
    name: '', category: '', subcategory: '',
    price: '', city: '', region: '', history: [],
  };
}

export default function ProductModal({ product, onSave, onClose, saving }) {
  const isEditing = Boolean(product);

  const [form,     setForm]     = useState(emptyForm());
  const [errors,   setErrors]   = useState({});
  const [showQR,   setShowQR]   = useState(false);
  const [qrBanner, setQrBanner] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name:        product.name        || '',
        category:    product.category    || '',
        subcategory: product.subcategory || '',
        price:       product.price != null ? String(product.price) : '',
        city:        product.city   || '',
        region:      product.region || '',
        history: (product.history || []).map((h) => ({
          id:        h.id        || genId(),
          orderDate: h.orderDate || '',
          sales:     h.sales !== undefined ? h.sales : '',
        })),
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setQrBanner('');
  }, [product]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())     e.name     = 'Product name is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!form.city.trim())     e.city     = 'City is required';
    const price = Number(form.price);
    if (!form.price || isNaN(price) || price <= 0)
      e.price = 'Enter a valid positive price';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    await onSave({
      ...form,
      price:   Number(form.price),
      history: form.history.map((h) => ({
        ...h, sales: Number(h.sales || 0),
      })),
    });
  }

  function handleQRScan(parsed) {
    if (parsed.source === 'barcode-not-found' || parsed.source === 'barcode-error') {
      setQrBanner('not-found');
      setTimeout(() => setQrBanner(''), 5000);
      return;
    }
    setForm((f) => ({
      ...f,
      name:        parsed.name        || f.name,
      category:    parsed.category    || f.category,
      subcategory: parsed.subcategory || f.subcategory,
      price:       parsed.price       ? String(parsed.price) : f.price,
      city:        parsed.city        || f.city,
      region:      parsed.region      || f.region,
    }));
    setQrBanner('success');
    setTimeout(() => setQrBanner(''), 4000);
  }

  const subcatOptions = SUBCATEGORIES[form.category] || [];

  return (
    <>
      <ModalPortal>
        <div
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
        >
          <div className="product-modal card">

            {/* ── Header ───────────────────────────────────── */}
            <div className="pm-header">
              <div>
                <h3 className="pm-title">
                  {isEditing ? 'Edit product' : 'Add product'}
                </h3>
                {isEditing && (
                  <p className="text-sm text-muted" style={{ marginTop: 2 }}>
                    {product.name}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowQR(true)}
                  title="Scan QR or barcode to fill form"
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
                  QR / Barcode
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={onClose}
                  disabled={saving}
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* ── QR banner ─────────────────────────────────── */}
            {qrBanner === 'success' && (
              <div className="alert alert-success pm-banner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M20 6L9 17l-5-5"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Product info filled from scan — review and save
              </div>
            )}
            {qrBanner === 'not-found' && (
              <div className="alert alert-error pm-banner">
                Barcode not found in database — fill in the details manually
              </div>
            )}

            {/* ── Form body ─────────────────────────────────── */}
            <form id="pm-form" onSubmit={handleSubmit} className="pm-body">

              {/* Product name */}
              <div className="form-group pm-full">
                <label className="label">Product name *</label>
                <div className="input-voice-row">
                  <input
                    className={`input ${errors.name ? 'error' : ''}`}
                    placeholder="e.g. Parle-G Biscuits"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    autoComplete="off"
                  />
                  <VoiceInputButton
                    fieldLabel="product name"
                    onResult={(t) => setField('name', t)}
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="label">Category *</label>
                <div className="input-voice-row">
                  <input
                    list="pm-cats"
                    className={`input ${errors.category ? 'error' : ''}`}
                    placeholder="e.g. Snacks"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    autoComplete="off"
                  />
                  <datalist id="pm-cats">
                    {CATEGORIES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                  <VoiceInputButton
                    fieldLabel="category"
                    onResult={(t) => setField('category', t)}
                  />
                </div>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              {/* Subcategory */}
              <div className="form-group">
                <label className="label">Subcategory</label>
                <div className="input-voice-row">
                  <input
                    list="pm-subcats"
                    className="input"
                    placeholder="e.g. Biscuits"
                    value={form.subcategory}
                    onChange={(e) => setField('subcategory', e.target.value)}
                    autoComplete="off"
                  />
                  <datalist id="pm-subcats">
                    {subcatOptions.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <VoiceInputButton
                    fieldLabel="subcategory"
                    onResult={(t) => setField('subcategory', t)}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="form-group">
                <label className="label">Price (₹) *</label>
                <div className="input-voice-row">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`input ${errors.price ? 'error' : ''}`}
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                  />
                  <VoiceInputButton
                    fieldLabel="price"
                    onResult={(t) => {
                      const n = t.replace(/[^\d.]/g, '');
                      if (n) setField('price', n);
                    }}
                  />
                </div>
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>

              {/* City */}
              <div className="form-group">
                <label className="label">City *</label>
                <div className="input-voice-row">
                  <input
                    className={`input ${errors.city ? 'error' : ''}`}
                    placeholder="e.g. Pune"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    autoComplete="off"
                  />
                  <VoiceInputButton
                    fieldLabel="city"
                    onResult={(t) => setField('city', t)}
                  />
                </div>
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>

              {/* Region */}
              <div className="form-group">
                <label className="label">Region</label>
                <div className="input-voice-row">
                  <input
                    className="input"
                    placeholder="e.g. West"
                    value={form.region}
                    onChange={(e) => setField('region', e.target.value)}
                    autoComplete="off"
                  />
                  <VoiceInputButton
                    fieldLabel="region"
                    onResult={(t) => setField('region', t)}
                  />
                </div>
              </div>

              {/* Sales history */}
              <div className="pm-full">
                <SalesHistoryTable
                  history={form.history}
                  onChange={(h) => setField('history', h)}
                />
              </div>

            </form>

            {/* ── Footer ────────────────────────────────────── */}
            <div className="pm-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="pm-form"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <><span className="spinner spinner-sm spinner-white" /> Saving…</>
                ) : isEditing ? 'Save changes' : 'Add product'}
              </button>
            </div>

          </div>
        </div>
      </ModalPortal>

      {/* QR scanner — has its own Portal internally */}
      {showQR && (
        <QRScannerModal
          onScan={(result) => { handleQRScan(result); setShowQR(false); }}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  );
}