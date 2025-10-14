// frontend/pages/inventory.js
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import ProductList from "../components/ProductList";
import ProductModal from "../components/ProductModal";
import { loadProducts, saveProducts } from "../lib/storage";
import { useRouter } from "next/router";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [initialModalData, setInitialModalData] = useState(null);
  const router = useRouter();

  useEffect(() => setProducts(loadProducts()), []);

  // When query param 'template' is present, parse and open modal with data
  useEffect(() => {
    if (router && router.query && router.query.template) {
      try {
        const decoded = decodeURIComponent(router.query.template);
        const parsed = JSON.parse(decoded);
        // normalized structure expected by ProductModal
        const template = {
          id: genId(),
          name: parsed.name || `${parsed.subcategory} ${parsed.category}`.trim(),
          category: parsed.category || "",
          subcategory: parsed.subcategory || "",
          city: parsed.city || "",
          region: parsed.region || "",
          price: parsed.price || "",
          history: parsed.history || [],
        };
        setInitialModalData(template);
        setEditIdx(null);
        setShowModal(true);
        // remove query param from URL without reload
        const { pathname, query } = router;
        const newQuery = { ...query };
        delete newQuery.template;
        router.replace({ pathname, query: newQuery }, undefined, { shallow: true });
      } catch (e) {
        console.warn("Invalid template param", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

  const openAdd = () => {
    setEditIdx(null);
    setInitialModalData(null);
    setShowModal(true);
  };
  const openEdit = (idx) => {
    setEditIdx(idx);
    setInitialModalData(null);
    setShowModal(true);
  };

  const onSave = (prod) => {
    const copy = [...products];
    const nameNormalized = (prod.name || "").trim().toLowerCase();

    if (editIdx != null) {
      const dupIdx = copy.findIndex((p, i) => i !== editIdx && (p.name || "").trim().toLowerCase() === nameNormalized);
      if (dupIdx !== -1) {
        alert("Another product with the same name already exists. Choose a different name.");
        return;
      }
      copy[editIdx] = prod;
    } else {
      const exists = copy.some((p) => (p.name || "").trim().toLowerCase() === nameNormalized);
      if (exists) {
        alert("A product with the same name already exists. Choose a different name or edit the existing product.");
        return;
      }
      copy.unshift(prod);
    }
    setProducts(copy);
    saveProducts(copy);
  };

  const onDelete = (idx) => {
    if (!confirm("Delete product?")) return;
    const copy = products.filter((_, i) => i !== idx);
    setProducts(copy);
    saveProducts(copy);
  };

  return (
    <>
      <NavBar />
      <div className="container">
        
        <ProductList
          products={products}
          onEdit={openEdit}
          onDelete={onDelete}
          addProduct={openAdd}
        />

        {showModal && (
          <ProductModal
            initial={initialModalData != null ? initialModalData : (editIdx != null ? products[editIdx] : null)}
            onClose={() => {
              setShowModal(false);
              setEditIdx(null);
              setInitialModalData(null);
            }}
            onSave={(p) => {
              onSave(p);
              setShowModal(false);
              setEditIdx(null);
              setInitialModalData(null);
            }}
          />
        )}
      </div>
    </>
  );
}
