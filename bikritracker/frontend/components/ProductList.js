// frontend/components/ProductList.js
import React from "react";

function getLatestSalesValue(history){
  if(!history || history.length === 0) return "-";
  // parse dates and find the row with max date
  try{
    let best = history[0];
    let bestDate = new Date(history[0].Orderdate);
    for(let i=1;i<history.length;i++){
      const d = new Date(history[i].Orderdate);
      if(isNaN(d)) continue;
      if(isNaN(bestDate) || d > bestDate){
        bestDate = d;
        best = history[i];
      }
    }
    return best && (best.Sales !== undefined && best.Sales !== null) ? best.Sales : "-";
  }catch(e){
    console.error("getLatestSalesValue error", e);
    return "-";
  }
}

export default function ProductList({
  products,
  onEdit,
  onDelete,
  addProduct,
}) {
  return (
    <div className="productlist-card">
      {/* Header with title + button */}
      <div className="productlist-header">
        <div className="productlist-info">
          <h2>Inventory</h2>
          <div className="small">Add and manage your products</div>
        </div>
        <button className="btn" onClick={addProduct}>
          + Add product
        </button>
      </div>

      {/* Product Table */}
      {products.length === 0 ? (
        <p className="small">
          No products added yet. Click "+ Add product" to create one.
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>City</th>
                <th>Last Sales</th>
                <th>History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => (
                <tr key={p.id || idx}>
                  <td data-label="Product">{p.name}</td>
                  <td data-label="Category">{p.category}</td>
                  <td data-label="City">{p.city}</td>
                  <td data-label="Last Sales">
                    {getLatestSalesValue(p.history)}
                  </td>
                  <td data-label="History">
                    {p.history ? p.history.length : 0}
                  </td>
                  <td data-label="Actions">
                    <div className="flex">
                      <button
                        className="btn secondary"
                        onClick={() => onEdit(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => onDelete(idx)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
