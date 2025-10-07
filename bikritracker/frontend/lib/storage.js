// lib/storage.js
const KEY = "bikri_products_v1";

export function loadProducts(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return [];
    return JSON.parse(raw);
  }catch(e){
    console.error("loadProducts error", e);
    return [];
  }
}

export function saveProducts(list){
  try{
    localStorage.setItem(KEY, JSON.stringify(list));
  }catch(e){
    console.error("saveProducts error", e);
  }
}
