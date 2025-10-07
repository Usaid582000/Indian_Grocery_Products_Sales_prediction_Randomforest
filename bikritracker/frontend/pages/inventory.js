// pages/inventory.js
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import ProductList from "../components/ProductList";
import ProductModal from "../components/ProductModal";
import { loadProducts, saveProducts } from "../lib/storage";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  useEffect(() => setProducts(loadProducts()), []);

  const openAdd = () => {
    setEditIdx(null);
    setShowModal(true);
  };
  const openEdit = (idx) => {
    setEditIdx(idx);
    setShowModal(true);
  };

  const onSave = (prod) => {
    const copy = [...products];
    if (editIdx != null) {
      copy[editIdx] = prod;
    } else {
      copy.unshift(prod);
    }
    setProducts(copy);
    saveProducts(copy);
  };

  const onDelete = (idx) => {
    if (!confirm("Delete product? This removes local data only.")) return;
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
            initial={editIdx != null ? products[editIdx] : null}
            onClose={() => setShowModal(false)}
            onSave={(p) => {
              onSave(p);
              setShowModal(false);
            }}
          />
        )}
      </div>
    </>
  );
}
