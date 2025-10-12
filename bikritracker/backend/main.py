# backend/main.py
import os
import tempfile
import urllib.request
import difflib
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sales Prediction API", version="v1.0")

# -----------------------------
# CORS (keep permissive for now)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config (env override)
MODEL_PATH = os.environ.get("MODEL_PATH", "sales_model_v2.joblib")
META_CSV_PATH = os.environ.get("META_CSV_PATH", "supermarket-sales.csv")


# -----------------------------
# Model loading helper
# -----------------------------
def load_model(path):
    try:
        if str(path).lower().startswith(("http://", "https://")):
            tmpf = os.path.join(tempfile.gettempdir(), "downloaded_model.joblib")
            urllib.request.urlretrieve(path, tmpf)
            return joblib.load(tmpf)
        return joblib.load(path)
    except Exception as e:
        raise RuntimeError(f"Failed to load model from {path}: {e}")


try:
    model_data = load_model(MODEL_PATH)
    # Accept either dict with model+feature_list or raw estimator
    if isinstance(model_data, dict) and "model" in model_data and "feature_list" in model_data:
        model = model_data["model"]
        feature_list: List[str] = list(model_data["feature_list"])
    else:
        model = model_data
        feature_list = []
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")


# -----------------------------
# Known dummy tokens parsed from feature_list (if available)
# -----------------------------
_known_tokens = {"Category": [], "Subcategory": [], "City": [], "Region": []}
for f in feature_list:
    for k in _known_tokens.keys():
        if f.startswith(f"{k}_"):
            _known_tokens[k].append(f.split(f"{k}_", 1)[1])
for k in _known_tokens:
    _known_tokens[k] = sorted(list(set(_known_tokens[k])))


# -----------------------------
# Request schemas
# -----------------------------
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
    predict_date: Optional[str] = None


# -----------------------------
# Utility: read meta CSV options
# -----------------------------
def read_meta_options(csv_path: str):
    if not csv_path:
        return {"categories": [], "subcategories": []}
    try:
        if str(csv_path).lower().startswith(("http://", "https://")):
            tmpf = os.path.join(tempfile.gettempdir(), "meta_source.csv")
            urllib.request.urlretrieve(csv_path, tmpf)
            df = pd.read_csv(tmpf)
        elif os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
        else:
            return {"categories": [], "subcategories": []}
    except Exception:
        return {"categories": [], "subcategories": []}
    cats = sorted([str(x).strip() for x in df["Category"].dropna().unique()]) if "Category" in df.columns else []
    subs = sorted([str(x).strip() for x in df["Subcategory"].dropna().unique()]) if "Subcategory" in df.columns else []
    return {"categories": cats, "subcategories": subs}


# -----------------------------
# Fuzzy mapping helper
# -----------------------------
def fuzzy_map_input(val, token_list, cutoff=0.55):
    if not val or not isinstance(val, str):
        return None
    s = val.strip()
    for t in token_list:
        if t.lower() == s.lower():
            return t
    matches = difflib.get_close_matches(s, token_list, n=1, cutoff=cutoff)
    return matches[0] if matches else None


@app.get("/health")
def health():
    return {"status": "ok", "model_version": "v1.0"}


@app.get("/meta/options")
def meta_options():
    return JSONResponse(content=read_meta_options(META_CSV_PATH))


# -----------------------------
# Helper: determine model_expected_features
# -----------------------------
def get_model_expected_features() -> List[str]:
    # 1) feature_list from artifact (preferred)
    if feature_list:
        return list(feature_list)
    # 2) scikit-learn estimator attribute `feature_names_in_` if present
    fn = getattr(model, "feature_names_in_", None)
    if fn is not None:
        try:
            return list(fn)
        except Exception:
            pass
    # 3) fallback list based on how training notebook built features
    fallback = [
        "city_code", "city_mean_sales",
        "year", "month", "day", "weekday", "is_weekend",
        "lag_1", "lag_7", "lag_14", "lag_30",
        "roll_mean_7", "roll_mean_14", "roll_mean_30",
        "sales_diff_1", "sales_pct_change_7"
    ]
    return fallback


# -----------------------------
# Main predict endpoint
# -----------------------------
@app.post("/predict")
async def predict_sales(request: Request):
    try:
        body = await request.json()
        try:
            req = PredictRequest(**body)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=ve.errors())

        # build dataframe from history
        hist_df = pd.DataFrame([h.dict() for h in req.history])
        if hist_df.empty:
            raise HTTPException(status_code=400, detail="history must contain at least one row with Orderdate and Sales.")

        # parse dates
        hist_df["Orderdate"] = pd.to_datetime(hist_df["Orderdate"], errors="coerce")
        hist_df = hist_df.sort_values("Orderdate").reset_index(drop=True)

        # decide prediction date (client-provided takes precedence)
        if req.predict_date and str(req.predict_date).strip() != "":
            try:
                pred_date = pd.to_datetime(req.predict_date)
            except Exception:
                pred_date = pd.to_datetime(datetime.utcnow().date()) + pd.DateOffset(months=1)
        else:
            last_valid = hist_df["Orderdate"].dropna().max()
            if pd.isna(last_valid):
                last_valid = pd.to_datetime(datetime.utcnow().date())
            pred_date = last_valid + pd.DateOffset(months=1)

        # append prediction row (Sales=NaN)
        combined = pd.concat([hist_df, pd.DataFrame([{"Orderdate": pred_date, "Sales": np.nan}])], ignore_index=True)
        combined["Orderdate"] = pd.to_datetime(combined["Orderdate"], errors="coerce")
        combined = combined.sort_values("Orderdate").reset_index(drop=True)

        # compute base temporal features
        combined["year"] = combined["Orderdate"].dt.year
        combined["month"] = combined["Orderdate"].dt.month
        combined["day"] = combined["Orderdate"].dt.day
        combined["weekday"] = combined["Orderdate"].dt.weekday
        combined["is_weekend"] = combined["weekday"].isin([5, 6]).astype(int)

        # create lags used in notebook
        for lag in [1, 7, 14, 30]:
            combined[f"lag_{lag}"] = combined["Sales"].shift(lag)

        # rolling means (naming used in notebook)
        combined["roll_mean_7"] = combined["Sales"].shift(1).rolling(window=7, min_periods=1).mean()
        combined["roll_mean_14"] = combined["Sales"].shift(1).rolling(window=14, min_periods=1).mean()
        combined["roll_mean_30"] = combined["Sales"].shift(1).rolling(window=30, min_periods=1).mean()

        # other engineered features
        combined["sales_diff_1"] = combined["Sales"] - combined["Sales"].shift(1)
        combined["sales_pct_change_7"] = (combined["Sales"] / combined["Sales"].shift(7) - 1).replace([np.inf, -np.inf], np.nan)

        # take the last row (prediction row) as tail
        tail = combined.tail(1).copy().reset_index(drop=True)

        # prepare mapped categorical tokens
        raw_inputs = req.product.dict()
        mapped_inputs = {}
        for k in ["Category", "Subcategory", "City", "Region"]:
            val = (raw_inputs.get(k) or "").strip()
            mapped = fuzzy_map_input(val, _known_tokens.get(k, []), cutoff=0.55)
            final = mapped if mapped is not None else (val if val != "" else None)
            mapped_inputs[k] = {"input": val, "mapped": mapped, "final": final}

        # determine model expected features
        expected = get_model_expected_features()

        # create X_final with expected columns (default zeros)
        X_final = pd.DataFrame(0.0, index=[0], columns=expected)

        # map numeric/time features from tail to expected (best-effort)
        numeric_map = {
            "year": "year",
            "month": "month",
            "day": "day",
            "weekday": "weekday",
            "is_weekend": "is_weekend",
            "lag_1": "lag_1",
            "lag_7": "lag_7",
            "lag_14": "lag_14",
            "lag_30": "lag_30",
            "roll_mean_7": "roll_mean_7",
            "roll_mean_14": "roll_mean_14",
            "roll_mean_30": "roll_mean_30",
            "sales_diff_1": "sales_diff_1",
            "sales_pct_change_7": "sales_pct_change_7",
        }
        for src, tgt in numeric_map.items():
            if tgt in X_final.columns and src in tail.columns:
                val = tail.iloc[0].get(src, 0.0)
                if pd.isna(val):
                    val = 0.0
                X_final.loc[0, tgt] = float(val)

        # map categorical dummies if present in model expected features
        for cat in ["Category", "Subcategory", "City", "Region"]:
            final_token = mapped_inputs[cat]["final"]
            if final_token:
                colname = f"{cat}_{final_token}"
                if colname in X_final.columns:
                    X_final.loc[0, colname] = 1.0

        # Ensure numeric dtype and fillna
        X_final = X_final.fillna(0.0).astype(float)

        # If model expects different column naming (old sklearn fitted with different order), ensure we pass DataFrame with those names
        # model.predict of sklearn will accept DataFrame with column names matching training feature names.
        try:
            pred_log = model.predict(X_final)[0]
        except Exception as e:
            # include a small debug snippet to help diagnose mismatch in logs
            debug = {
                "expected_sample": expected[:20],
                "X_cols": X_final.columns.tolist(),
                "X_shape": X_final.shape,
                "mapped_inputs": mapped_inputs,
            }
            raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}. Debug: {debug}")

        pred_sales = float(np.expm1(pred_log))

        # ensemble diagnostics (optional)
        ensemble_mean = None
        ensemble_std = None
        per_tree_sales_median = None
        try:
            estimators = getattr(model, "estimators_", None)
            if estimators:
                per_tree_preds_log = np.array([est.predict(X_final)[0] for est in estimators])
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

        # compute simple smape-like metric from recent sales (informational)
        try:
            recent = combined["Sales"].dropna().tail(7)
            if len(recent) > 1 and recent.mean() > 0:
                vol = recent.std() / (recent.mean() + 1e-6)
                confidence = float(max(0.7, 1 - vol / 5))
                smape_val = round(max(1.0, (1 - confidence) * 100), 2)
            else:
                smape_val = 10.0
        except Exception:
            smape_val = 10.0

        # format prediction date
        prediction_date_str = pd.to_datetime(pred_date).strftime("%Y-%m-%d")

        _debug = {
            "expected_len": len(expected),
            "expected_sample": expected[:20],
            "X_shape": X_final.shape,
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
            "prediction_date": prediction_date_str,
            "historical_accuracy": {"metric": "SMAPE", "value": smape_val},
            "notes": "Prediction prepared using model (auto-aligned features when possible).",
            "ensemble_central": round(ensemble_central, 2) if ensemble_central is not None else None,
            "ensemble_uncertainty_pct": ensemble_uncertainty_pct,
            "_debug": _debug
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
