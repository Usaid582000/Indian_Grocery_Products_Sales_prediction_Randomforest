/**
 * All calls to the FastAPI backend go through here.
 * Every request sends x-user-id so the backend knows which
 * Firestore collection to read from.
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail?.message || body?.detail || detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  return res.json();
}

// ── Auth header helper ─────────────────────────────────────────
function userHeader(uid) {
  return { 'x-user-id': uid };
}

// ── Predict ────────────────────────────────────────────────────
export async function predictSales({ uid, productId, predictDate, forceRetrain = false }) {
  return apiFetch('/predict', {
    method:  'POST',
    headers: userHeader(uid),
    body: JSON.stringify({
      product_id:    productId,
      predict_date:  predictDate || null,
      force_retrain: forceRetrain,
    }),
  });
}

// ── Train ──────────────────────────────────────────────────────
export async function trainModel({ uid, productId, force = false }) {
  return apiFetch('/train', {
    method:  'POST',
    headers: userHeader(uid),
    body: JSON.stringify({ product_id: productId, force }),
  });
}

export async function getTrainStatus({ uid, productId }) {
  return apiFetch(`/train/status/${productId}`, {
    headers: userHeader(uid),
  });
}

export async function clearModelCache({ uid, productId }) {
  return apiFetch(`/train/cache/${productId}`, {
    method:  'DELETE',
    headers: userHeader(uid),
  });
}

// ── Health ─────────────────────────────────────────────────────
export async function checkHealth() {
  return apiFetch('/health');
}