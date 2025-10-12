// frontend/components/ProductModal.js
import { useState, useEffect } from "react";

function genId(){ return Date.now().toString(36) }

export default function ProductModal({ initial, onClose, onSave }) {
  const init = initial || {
    id: genId(),
    name: "",
    category: "",
    subcategory: "",
    // city removed per request
    region: "",
    price: "",        // NEW
    history: []
  };
  const [product, setProduct] = useState(init);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(()=> setProduct(initial || init), [initial]);

  // fetch meta options from backend
  useEffect(()=>{
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    fetch(`${backend}/meta/options`).then(r=>{
      if(!r.ok) throw new Error("no meta");
      return r.json();
    }).then(data=>{
      setCategories(data.categories || []);
      setSubcategories(data.subcategories || []);
    }).catch(()=>{/*ignore*/});
  }, []);

  const update = (k,v) => setProduct({...product, [k]: v});
  const updateHistory = (idx, k, v) => {
    const h = (product.history || []).slice();
    h[idx] = {...h[idx], [k]: v};
    setProduct({...product, history:h});
  };
  const addHistory = ()=> setProduct({...product, history: [...(product.history||[]), { Orderdate:"", Sales:"" }]});
  const removeHistory = (i) => {
    const h = (product.history||[]).filter((_,j)=>j!==i);
    setProduct({...product, history: h});
  };

  const save = () => {
    // required checks
    if(!product.name || !product.name.trim()){
      alert("Product name is required");
      return;
    }
    if(!product.category || !product.category.trim()){
      alert("Category is required");
      return;
    }
    if(!product.subcategory || !product.subcategory.trim()){
      alert("Subcategory is required");
      return;
    }
    // price validation
    const priceNum = Number(product.price);
    if(Number.isNaN(priceNum) || priceNum <= 0){
      alert("Please enter a valid positive price.");
      return;
    }
    if(!product.history || product.history.length < 30){
      alert("Please enter at least 30 history rows for best predictions.");
      return;
    }

    // convert sales to numbers & ensure date format
    const hist = (product.history||[]).map(h=>({ Orderdate: h.Orderdate, Sales: Number(h.Sales || 0) }));
    onSave({...product, history:hist, price: priceNum});
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e)=>{ if(e.target.className==='modal-backdrop') onClose(); }}>
      <div className="modal">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <h3>{initial ? "Edit product":"Add product"}</h3>
        </div>

        <div className="stacked-row">
          <div>
            <label className="kv">Product name *</label>
            <input className="input" value={product.name} onChange={(e)=>update("name", e.target.value)} />
          </div>

          <div>
            <label className="kv">Category (type or choose) *</label>
            <input list="category-list" className="input" value={product.category} onChange={(e)=>update("category", e.target.value)} />
            <datalist id="category-list">
              {categories.map((c,i)=>(<option key={i} value={c} />))}
            </datalist>
          </div>

          <div>
            <label className="kv">Subcategory (type or choose) *</label>
            <input list="subcategory-list" className="input" value={product.subcategory} onChange={(e)=>update("subcategory", e.target.value)} />
            <datalist id="subcategory-list">
              {subcategories.map((s,i)=>(<option key={i} value={s} />))}
            </datalist>
          </div>

          <div>
            <label className="kv">Price (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={product.price}
              onChange={(e)=>update("price", e.target.value)}
            />
          </div>

          <div>
            <label className="kv">Region</label>
            <input className="input" value={product.region} onChange={(e)=>update("region", e.target.value)} />
          </div>

          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <label className="kv">Sales history (add rows)</label>
              <button className="btn secondary" onClick={addHistory}>+ Add row</button>
            </div>

            {(product.history||[]).map((h,i)=>(
              <div key={i} className="history-row" style={{marginTop:8, alignItems:'center'}}>
                {/* serial number badge */}
                <div style={{width:28, textAlign:'center', fontSize:13, color:'#444', fontWeight:600}}>
                  {i+1}
                </div>

                <input type="date" className="input" value={h.Orderdate} onChange={(e)=>updateHistory(i,'Orderdate',e.target.value)} />
                <input type="number" placeholder="Sales" className="input" value={h.Sales} onChange={(e)=>updateHistory(i,'Sales',e.target.value)} />
                <button className="btn danger" onClick={()=>removeHistory(i)}>Delete</button>
              </div>
            ))}
            <div className="small" style={{marginTop:6}}>Tip: Enter at least 30 rows — one per day/week/month depending on your data.</div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
            <button className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={save}>Save product</button>
          </div>
        </div>
      </div>
    </div>
  );
}
