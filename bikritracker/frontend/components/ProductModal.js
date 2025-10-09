// frontend/components/ProductModal.js
import { useState, useEffect } from "react";

function genId(){ return Date.now().toString(36) }

export default function ProductModal({initial, onClose, onSave}) {
  const init = initial || {
    id: genId(), name:"", category:"", subcategory:"", city:"", region:"", history: []
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
    if(!product.name || !product.name.trim()) return alert("Enter product name");
    // convert sales to numbers & ensure date format
    const hist = (product.history||[]).map(h=>({ Orderdate: h.Orderdate, Sales: Number(h.Sales || 0) }));
    onSave({...product, history:hist});
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
            <label className="kv">Product name</label>
            <input className="input" value={product.name} onChange={(e)=>update("name", e.target.value)} />
          </div>

          <div>
            <label className="kv">Category (type or choose)</label>
            <input list="category-list" className="input" value={product.category} onChange={(e)=>update("category", e.target.value)} />
            <datalist id="category-list">
              {categories.map((c,i)=>(<option key={i} value={c} />))}
            </datalist>
          </div>

          <div>
            <label className="kv">Subcategory (type or choose)</label>
            <input list="subcategory-list" className="input" value={product.subcategory} onChange={(e)=>update("subcategory", e.target.value)} />
            <datalist id="subcategory-list">
              {subcategories.map((s,i)=>(<option key={i} value={s} />))}
            </datalist>
          </div>

          <div>
            <label className="kv">City</label>
            <input className="input" value={product.city} onChange={(e)=>update("city", e.target.value)} />
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
              <div key={i} className="history-row" style={{marginTop:8}}>
                <input type="date" className="input" value={h.Orderdate} onChange={(e)=>updateHistory(i,'Orderdate',e.target.value)} />
                <input type="number" placeholder="Sales" className="input" value={h.Sales} onChange={(e)=>updateHistory(i,'Sales',e.target.value)} />
                <button className="btn danger" onClick={()=>removeHistory(i)}>Delete</button>
              </div>
            ))}
            <div className="small" style={{marginTop:6}}>Tip: Enter last few months (one row per month) for best results.</div>
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
