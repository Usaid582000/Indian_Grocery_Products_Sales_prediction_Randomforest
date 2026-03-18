import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── ID generator ─────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Collection refs ───────────────────────────────────────────
export const productsRef   = (uid) => collection(db, 'users', uid, 'products');
export const predictionsRef = (uid) => collection(db, 'users', uid, 'predictions');
export const productDocRef  = (uid, pid) => doc(db, 'users', uid, 'products', pid);
export const predDocRef     = (uid, predId) => doc(db, 'users', uid, 'predictions', predId);

// ================================================================
// PRODUCTS
// ================================================================

/**
 * Add a new product for the user.
 * history is stored as an array inside the product document.
 * Each history item: { id, orderDate: 'YYYY-MM-DD', sales: number }
 */
export async function addProduct(uid, productData) {
  const history = (productData.history || []).map((h) => ({
    id:        h.id        || genId(),
    orderDate: h.orderDate || h.Orderdate || '',
    sales:     Number(h.sales || h.Sales || 0),
  }));

  const payload = {
    name:        (productData.name        || '').trim(),
    category:    (productData.category    || '').trim(),
    subcategory: (productData.subcategory || '').trim(),
    price:       Number(productData.price || 0),
    city:        (productData.city        || '').trim(),
    region:      (productData.region      || '').trim(),
    history,
    historyCount: history.length,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  };

  const ref = await addDoc(productsRef(uid), payload);
  return ref.id;
}

/**
 * Update an existing product (name, category, price, city, etc.)
 * Pass only the fields you want to change.
 */
export async function updateProduct(uid, productId, updates) {
  const data = { ...updates, updatedAt: serverTimestamp() };

  // normalise history if it was passed
  if (updates.history !== undefined) {
    const history = updates.history.map((h) => ({
      id:        h.id        || genId(),
      orderDate: h.orderDate || h.Orderdate || '',
      sales:     Number(h.sales || h.Sales || 0),
    }));
    data.history     = history;
    data.historyCount = history.length;
  }

  // coerce price to number if passed
  if (updates.price !== undefined) {
    data.price = Number(updates.price);
  }

  await updateDoc(productDocRef(uid, productId), data);
}

/**
 * Delete a product and all associated predictions for that product.
 * Uses a batch so both deletions are atomic.
 */
export async function deleteProduct(uid, productId) {
  // just delete the product doc — predictions are separate
  await deleteDoc(productDocRef(uid, productId));
}

/**
 * Fetch a single product with full history (used for editing / prediction).
 */
export async function getProduct(uid, productId) {
  const snap = await getDoc(productDocRef(uid, productId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─── History helpers (operate on the product's history array) ──

/**
 * Add one history entry to an existing product.
 * Reads current history first, appends, then writes back.
 */
export async function addHistoryEntry(uid, productId, entry) {
  const product = await getProduct(uid, productId);
  if (!product) throw new Error('Product not found');

  const newEntry = {
    id:        genId(),
    orderDate: entry.orderDate || entry.Orderdate || '',
    sales:     Number(entry.sales || entry.Sales || 0),
  };

  const history = [...(product.history || []), newEntry];

  await updateDoc(productDocRef(uid, productId), {
    history,
    historyCount: history.length,
    updatedAt:    serverTimestamp(),
  });

  return newEntry.id;
}

/**
 * Remove one history entry by its id.
 */
export async function removeHistoryEntry(uid, productId, entryId) {
  const product = await getProduct(uid, productId);
  if (!product) throw new Error('Product not found');

  const history = (product.history || []).filter((h) => h.id !== entryId);

  await updateDoc(productDocRef(uid, productId), {
    history,
    historyCount: history.length,
    updatedAt:    serverTimestamp(),
  });
}

/**
 * Replace the entire history array in one write.
 * Used when bulk-editing history in the product modal.
 */
export async function replaceHistory(uid, productId, historyArray) {
  const history = historyArray.map((h) => ({
    id:        h.id        || genId(),
    orderDate: h.orderDate || h.Orderdate || '',
    sales:     Number(h.sales || h.Sales || 0),
  }));

  await updateDoc(productDocRef(uid, productId), {
    history,
    historyCount: history.length,
    updatedAt:    serverTimestamp(),
  });
}

// ================================================================
// PREDICTIONS
// ================================================================

/**
 * Save a new prediction result.
 */
export async function addPrediction(uid, predData) {
  const payload = {
    productId:      predData.productId      || '',
    productName:    predData.productName    || '',
    predictionDate: predData.predictionDate || '',
    predicted:      Number(predData.predicted  || 0),
    lowerBound:     Number(predData.lowerBound || 0),
    upperBound:     Number(predData.upperBound || 0),
    actual:         predData.actual   ?? null,
    accuracy:       predData.accuracy ?? null,
    price:          Number(predData.price || 0),
    createdAt:      serverTimestamp(),
  };

  const ref = await addDoc(predictionsRef(uid), payload);
  return ref.id;
}

/**
 * Update a prediction (e.g. set actual sales and recalculate accuracy).
 */
export async function updatePrediction(uid, predId, updates) {
  // if actual is being set, auto-calculate accuracy
  const data = { ...updates };

  if (
    updates.actual !== undefined &&
    updates.actual !== null &&
    updates.predicted !== undefined
  ) {
    const actual    = Number(updates.actual);
    const predicted = Number(updates.predicted);

    if (actual === 0) {
      data.accuracy = predicted === 0 ? 100 : 0;
    } else {
      const pctError = (Math.abs(predicted - actual) / actual) * 100;
      data.accuracy  = Math.max(0, Math.round((100 - pctError) * 100) / 100);
    }
  }

  await updateDoc(predDocRef(uid, predId), data);
}

/**
 * Delete a prediction record.
 */
export async function deletePrediction(uid, predId) {
  await deleteDoc(predDocRef(uid, predId));
}

// ================================================================
// USER PROFILE
// ================================================================

/**
 * Update the user's profile document (storeName, city, etc.)
 */
export async function updateUserProfile(uid, profileData) {
  await updateDoc(doc(db, 'users', uid), {
    ...profileData,
    updatedAt: serverTimestamp(),
  });
}