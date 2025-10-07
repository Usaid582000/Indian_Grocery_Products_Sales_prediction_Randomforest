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
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.city}</td>
                  <td>
                    {p.history && p.history.length
                      ? p.history[p.history.length - 1].Sales
                      : "-"}
                  </td>
                  <td>{p.history ? p.history.length : 0}</td>
                  <td>
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
