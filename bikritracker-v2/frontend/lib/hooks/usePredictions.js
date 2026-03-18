import { useEffect, useState, useCallback } from 'react';
import { query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import {
  predictionsRef,
  addPrediction    as fsAddPrediction,
  updatePrediction as fsUpdatePrediction,
  deletePrediction as fsDeletePrediction,
} from '../firestore';

/**
 * Real-time hook for the current user's predictions.
 *
 * Returns:
 *   predictions      — live array, newest first
 *   loading          — bool
 *   error            — string | null
 *   addPrediction    — async (data) => predId
 *   updatePrediction — async (predId, updates) => void
 *   deletePrediction — async (predId) => void
 *   avgAccuracy      — number (0-100) computed from predictions with actuals
 */
export function usePredictions() {
  const { user } = useAuth();

  const [predictions, setPredictions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Real-time listener ────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      predictionsRef(user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPredictions(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[usePredictions] snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  // ── Wrapped mutations ─────────────────────────────────────────
  const addPrediction = useCallback(
    (data) => fsAddPrediction(user.uid, data),
    [user]
  );

  const updatePrediction = useCallback(
    (predId, updates) => fsUpdatePrediction(user.uid, predId, updates),
    [user]
  );

  const deletePrediction = useCallback(
    (predId) => fsDeletePrediction(user.uid, predId),
    [user]
  );

  // ── Derived stats ─────────────────────────────────────────────
  const avgAccuracy = (() => {
    const withActuals = predictions.filter(
      (p) => p.accuracy !== null && p.accuracy !== undefined
    );
    if (!withActuals.length) return null;
    const sum = withActuals.reduce((acc, p) => acc + Number(p.accuracy), 0);
    return Math.round((sum / withActuals.length) * 10) / 10;
  })();

  return {
    predictions,
    loading,
    error,
    addPrediction,
    updatePrediction,
    deletePrediction,
    avgAccuracy,
  };
}