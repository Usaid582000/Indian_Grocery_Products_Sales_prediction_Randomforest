import { useEffect, useState, useCallback } from 'react';
import { query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import {
  productsRef,
  addProduct    as fsAddProduct,
  updateProduct as fsUpdateProduct,
  deleteProduct as fsDeleteProduct,
  getProduct    as fsGetProduct,
  replaceHistory,
} from '../firestore';

/**
 * Real-time hook for the current user's products.
 *
 * Returns:
 *   products      — live array, updates instantly when Firestore changes
 *   loading       — true only on first load
 *   error         — string or null
 *   addProduct    — async (productData) => productId
 *   updateProduct — async (productId, updates) => void
 *   deleteProduct — async (productId) => void
 *   getProduct    — async (productId) => product | null
 *   saveHistory   — async (productId, historyArray) => void
 */
export function useProducts() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Real-time listener ────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      productsRef(user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useProducts] snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  // ── Wrapped mutations (always pass uid internally) ────────────
  const addProduct = useCallback(
    (data) => fsAddProduct(user.uid, data),
    [user]
  );

  const updateProduct = useCallback(
    (id, updates) => fsUpdateProduct(user.uid, id, updates),
    [user]
  );

  const deleteProduct = useCallback(
    (id) => fsDeleteProduct(user.uid, id),
    [user]
  );

  const getProduct = useCallback(
    (id) => fsGetProduct(user.uid, id),
    [user]
  );

  const saveHistory = useCallback(
    (productId, historyArray) => replaceHistory(user.uid, productId, historyArray),
    [user]
  );

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    saveHistory,
  };
}