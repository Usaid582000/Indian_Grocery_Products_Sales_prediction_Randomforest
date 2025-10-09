// frontend/lib/storage.js
const PRODUCTS_KEY = "bikri_products_v1";
const PREDICTIONS_KEY = "bikri_predictions_v1";

export function loadProducts(){
  try{
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if(!raw) return [];
    return JSON.parse(raw);
  }catch(e){
    console.error("loadProducts error", e);
    return [];
  }
}

export function saveProducts(list){
  try{
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
  }catch(e){
    console.error("saveProducts error", e);
  }
}

/* Prediction history helpers */
export function loadPredictions(){
  try{
    const raw = localStorage.getItem(PREDICTIONS_KEY);
    if(!raw) return [];
    return JSON.parse(raw);
  }catch(e){
    console.error("loadPredictions error", e);
    return [];
  }
}

export function savePredictions(list){
  try{
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(list));
  }catch(e){
    console.error("savePredictions error", e);
  }
}

export function addPrediction(pred){
  const list = loadPredictions();
  list.unshift(pred); // newest first
  savePredictions(list);
  return list;
}

/**
 * addOrUpdatePrediction:
 * If a record with same productName + prediction_date exists, update 'predicted' and clear actual/accuracy.
 * Otherwise insert new (newest first).
 */
export function addOrUpdatePrediction(pred) {
  try {
    const list = loadPredictions();
    const idx = list.findIndex(p => p.productName === pred.productName && p.prediction_date === pred.prediction_date);
    if (idx !== -1) {
      // update existing
      list[idx] = {
        ...list[idx],
        predicted: pred.predicted,
        // reset actual/accuracy so user records fresh actual
        actual: null,
        accuracy: null
      };
      // move to top
      const item = list.splice(idx, 1)[0];
      list.unshift(item);
    } else {
      list.unshift(pred);
    }
    savePredictions(list);
    return list;
  } catch (e) {
    console.error("addOrUpdatePrediction error", e);
    return loadPredictions();
  }
}

export function updatePrediction(id, updates){
  const list = loadPredictions();
  const idx = list.findIndex((x)=>x.id === id);
  if(idx === -1) return list;
  list[idx] = {...list[idx], ...updates};
  savePredictions(list);
  return list;
}

export function deletePrediction(id){
  const list = loadPredictions();
  const out = list.filter((x)=>x.id !== id);
  savePredictions(out);
  return out;
}
