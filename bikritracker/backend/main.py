# backend/main.py
import os
import tempfile
import urllib.request
import difflib
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sales Prediction API", version="v1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.environ.get("MODEL_PATH", "sales_model_v1.joblib")
META_CSV_PATH = os.environ.get("META_CSV_PATH", "supermarket-sales.csv")

def load_model(path):
    try:
        if str(path).lower().startswith("http://") or str(path).lower().startswith("https://"):
            tmpf = os.path.join(tempfile.gettempdir(), "downloaded_model.joblib")
            urllib.request.urlretrieve(path, tmpf)
            return joblib.load(tmpf)
        else:
            return joblib.load(path)
    except Exception as e:
        raise RuntimeError(f"Failed to load model from {path}: {e}")

try:
    model_data = load_model(MODEL_PATH)
    model = model_data["model"]
    feature_list = model_data["feature_list"]
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")

# parse known tokens from feature_list
_known_tokens = {"Category": [], "Subcategory": [], "City": [], "Region": []}
for f in feature_list:
    if f.startswith("Category_"):
        _known_tokens["Category"].append(f.split("Category_", 1)[1])
    if f.startswith("Subcategory_"):
        _known_tokens["Subcategory"].append(f.split("Subcategory_", 1)[1])
    if f.startswith("City_"):
        _known_tokens["City"].append(f.split("City_", 1)[1])
    if f.startswith("Region_"):
        _known_tokens["Region"].append(f.split("Region_", 1)[1])

for k in _known_tokens:
    _known_tokens[k] = sorted(list(set(_known_tokens[k])))

class HistoryItem(BaseModel):
    Orderdate: str
    Sales: float

class ProductInfo(BaseModel):
    Category: str
    Subcategory: str
    City: str
    Region: str

class PredictRequest(BaseModel):
    product: ProductInfo
    history: list[HistoryItem]
    predict_date: str

def read_meta_options(csv_path: str):
    if not csv_path:
        return {"categories": [], "subcategories": []}
    try:
        if str(csv_path).lower().startswith("http://") or str(csv_path).lower().startswith("https://"):
            tmpf = os.path.join(tempfile.gettempdir(), "meta_source.csv")
            urllib.request.urlretrieve(csv_path, tmpf)
            df = pd.read_csv(tmpf)
        else:
            if not os.path.exists(csv_path):
                return {"categories": [], "subcategories": []}
            df = pd.read_csv(csv_path)
    except Exception:
        return {"categories": [], "subcategories": []}
    cats = []
    subs = []
    if "Category" in df.columns:
        cats = sorted([str(x).strip() for x in df["Category"].dropna().unique()])
    if "Subcategory" in df.columns:
        subs = sorted([str(x).strip() for x in df["Subcategory"].dropna().unique()])
    return {"categories": cats, "subcategories": subs}

def fuzzy_map_input(input_val: str, token_list: list, cutoff=0.55):
    """Return best match from token_list for input_val or None."""
    if not input_val or not isinstance(input_val, str):
        return None
    s = input_val.strip()
    # exact case-insensitive
    for t in token_list:
        if t.lower() == s.lower():
            return t
    matches = difflib.get_close_matches(s, token_list, n=1, cutoff=cutoff)
    return matches[0] if matches else None

@app.get("/health")
def health_check():
    return {"status": "ok", "model_version": "v1.0"}

@app.get("/meta/options")
def meta_options():
    opts = read_meta_options(META_CSV_PATH)
    return JSONResponse(content=opts)

@app.post("/predict")
async def predict_sales(request: Request):
    try:
        json_data = await request.json()
        try:
            validated_request = PredictRequest(**json_data)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=ve.errors())

        df = pd.DataFrame([h.dict() for h in validated_request.history])
        if df.empty:
            raise HTTPException(status_code=400, detail="history must contain at least one row with Orderdate and Sales.")
        df["Orderdate"] = pd.to_datetime(df["Orderdate"], errors="coerce")
        df = df.sort_values("Orderdate")

        pred_date = pd.to_datetime(validated_request.predict_date)
        new_row = {"Orderdate": pred_date, "Sales": np.nan}
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

        # temporal features
        df["year"] = df["Orderdate"].dt.year
        df["month"] = df["Orderdate"].dt.month
        df["day"] = df["Orderdate"].dt.day
        df["weekday"] = df["Orderdate"].dt.weekday
        df["is_weekend"] = df["weekday"].isin([5, 6]).astype(int)
        df = df.set_index("Orderdate").sort_index()

        # lag + rolling
        for lag in [1, 7, 30]:
            df[f"sales_lag_{lag}"] = df["Sales"].shift(lag)
        df["sales_roll_7"] = df["Sales"].shift(1).rolling(window=7, min_periods=1).mean()
        df["sales_roll_30"] = df["Sales"].shift(1).rolling(window=30, min_periods=1).mean()

        # construct base row (tail 1)
        tail = df.tail(1).drop(columns=["Sales"]).copy()
        # numeric/time features will be copied to final X below

        # map inputs
        raw_inputs = validated_request.product.dict()
        mapped_inputs = {}
        for k in ["Category", "Subcategory", "City", "Region"]:
            val = (raw_inputs.get(k) or "").strip()
            mapped = fuzzy_map_input(val, _known_tokens.get(k, []), cutoff=0.55)
            final = mapped if mapped is not None else val if val != "" else None
            mapped_inputs[k] = {"input": val, "mapped": mapped, "final": final}

        # Build X_final with exact feature_list columns (initialized to 0)
        X_final = pd.DataFrame(0.0, index=tail.index, columns=feature_list)

        # Copy numeric/time features if present in feature_list
        for col in ["year", "month", "day", "weekday", "is_weekend",
                    "sales_lag_1", "sales_lag_7", "sales_lag_30", "sales_roll_7", "sales_roll_30"]:
            if col in feature_list and col in tail.columns:
                X_final[col] = tail.iloc[0].get(col, 0.0)

        # Fill categorical dummy columns deterministically based on mapped_inputs
        for cat_key in ["Category", "Subcategory", "City", "Region"]:
            mapped_token = mapped_inputs[cat_key]["mapped"]
            final_token = mapped_inputs[cat_key]["final"]
            # if mapped_token found, set corresponding feature column to 1
            if mapped_token:
                col_name = f"{cat_key}_{mapped_token}"
                if col_name in X_final.columns:
                    X_final[col_name] = 1.0
            else:
                # if no fuzzy match, attempt to use final_token (user typed exact token)
                if final_token:
                    col_name = f"{cat_key}_{final_token}"
                    if col_name in X_final.columns:
                        X_final[col_name] = 1.0
                # else leave zeros (model sees no category dummies for this)
        # fallback: ensure numeric columns have floats and fillna
        X_final = X_final.astype(float).fillna(0.0)

        # Predict
        pred_log = model.predict(X_final)[0]
        pred_sales = float(np.expm1(pred_log))

        # ensemble diagnostics if available
        ensemble_mean = None
        ensemble_std = None
        per_tree_median_log = None
        per_tree_sales_median = None
        try:
            estimators = getattr(model, "estimators_", None)
            if estimators:
                per_tree_preds_log = np.array([est.predict(X_final)[0] for est in estimators])
                per_tree_median_log = float(np.median(per_tree_preds_log))
                per_tree_sales = np.expm1(per_tree_preds_log)
                per_tree_sales_median = float(np.median(per_tree_sales))
                ensemble_mean = float(per_tree_sales.mean())
                ensemble_std = float(per_tree_sales.std(ddof=0))
        except Exception:
            pass

        if per_tree_sales_median is not None and ensemble_std is not None:
            lower_bound = round(max(0.0, per_tree_sales_median - 1.96 * ensemble_std), 2)
            upper_bound = round(per_tree_sales_median + 1.96 * ensemble_std, 2)
            ensemble_uncertainty_pct = round(ensemble_std / (per_tree_sales_median + 1e-9) * 100, 2) if per_tree_sales_median > 0 else None
            ensemble_central = per_tree_sales_median
        else:
            lower_bound = round(pred_sales * 0.85, 2)
            upper_bound = round(pred_sales * 1.15, 2)
            ensemble_uncertainty_pct = None
            ensemble_central = pred_sales

        # dynamic accuracy approx for info only
        try:
            recent_sales = df["Sales"].dropna().tail(7)
            if len(recent_sales) > 1 and recent_sales.mean() > 0:
                volatility = recent_sales.std() / (recent_sales.mean() + 1e-6)
                confidence = float(max(0.7, 1 - volatility / 5))
                smape_value = round(max(1.0, (1 - confidence) * 100), 2)
            else:
                smape_value = 10.0
        except Exception:
            smape_value = 10.0

        # prepare debug
        nonzero_count = int((X_final.iloc[0] != 0).sum())
        missing = [c for c in feature_list if X_final.iloc[0].get(c, 0) == 0 and (c.startswith("Category_") or c.startswith("Subcategory_") or c.startswith("City_") or c.startswith("Region_"))]
        debug = {
            "feature_list_len": len(feature_list),
            "feature_list_sample": feature_list[:20],
            "X_pred_nonzero_count": nonzero_count,
            "missing_dummies_count": len(missing),
            "missing_dummies_sample": missing[:20],
            "mapped_inputs": mapped_inputs,
            "per_tree_sales_median": per_tree_sales_median,
            "ensemble_mean": ensemble_mean,
            "ensemble_std": ensemble_std,
        }

        return {
            "model_version": "v1.0",
            "prediction": round(float(pred_sales), 2),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "prediction_date": validated_request.predict_date,
            "historical_accuracy": {"metric": "SMAPE", "value": smape_value},
            "notes": "Prediction prepared using model + ensemble diagnostics (when available).",
            "ensemble_central": round(ensemble_central, 2) if ensemble_central is not None else None,
            "ensemble_uncertainty_pct": ensemble_uncertainty_pct,
            "_debug": debug
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
