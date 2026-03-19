"""
Per-user, per-product model training.

Strategy:
  - Each product gets its own Random Forest trained on its own history.
  - If a user has multiple products, we also train a cross-product
    "global" model that benefits from more data rows.
  - Models are cached on disk so repeated /predict calls are instant.
  - Auto-retrain whenever history grows by 10+ new rows since last train.
"""

import os
import hashlib
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

from .feature_builder import (
    history_to_df, build_features, get_X_y, FEATURE_COLS
)

MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./model_cache")
MIN_ROWS        = int(os.getenv("MIN_HISTORY_ROWS", "5"))


def _cache_path(uid: str, product_id: str) -> str:
    key = hashlib.sha256(f"{uid}:{product_id}".encode()).hexdigest()[:16]
    return os.path.join(MODEL_CACHE_DIR, f"{key}.joblib")


def _meta_path(uid: str, product_id: str) -> str:
    key = hashlib.sha256(f"{uid}:{product_id}".encode()).hexdigest()[:16]
    return os.path.join(MODEL_CACHE_DIR, f"{key}.meta.joblib")


def _should_retrain(meta: dict, current_row_count: int) -> bool:
    """Retrain if history grew by 10+ rows since last train."""
    trained_on = meta.get("trained_on_rows", 0)
    return (current_row_count - trained_on) >= 10


def train_product_model(
    uid: str,
    product_id: str,
    history: list[dict],
    force: bool = False,
) -> dict:
    """
    Train (or load from cache) a model for one product.

    Returns:
      {
        "model": RandomForestRegressor,
        "trained_at": ISO str,
        "rows_used": int,
        "cv_rmse": float | None,
        "feature_cols": list[str],
        "status": "trained" | "loaded" | "insufficient_data"
      }
    """
    os.makedirs(MODEL_CACHE_DIR, exist_ok=True)

    cache = _cache_path(uid, product_id)
    meta_p = _meta_path(uid, product_id)

    df = history_to_df(history)
    row_count = len(df)

    # ── Load from cache if still fresh ──────────────────────────
    if not force and os.path.exists(cache) and os.path.exists(meta_p):
        meta = joblib.load(meta_p)
        if not _should_retrain(meta, row_count):
            model = joblib.load(cache)
            return {
                "model":        model,
                "trained_at":   meta.get("trained_at", ""),
                "rows_used":    meta.get("trained_on_rows", 0),
                "cv_rmse":      meta.get("cv_rmse"),
                "feature_cols": FEATURE_COLS,
                "status":       "loaded",
            }

    # ── Not enough data ──────────────────────────────────────────
    if row_count < MIN_ROWS:
        return {
            "model":        None,
            "trained_at":   None,
            "rows_used":    row_count,
            "cv_rmse":      None,
            "feature_cols": FEATURE_COLS,
            "status":       "insufficient_data",
        }

    # ── Build features ───────────────────────────────────────────
    feat_df = build_features(df)
    X, y = get_X_y(feat_df)

    if X is None or len(X) < MIN_ROWS:
        return {
            "model":        None,
            "trained_at":   None,
            "rows_used":    row_count,
            "cv_rmse":      None,
            "feature_cols": FEATURE_COLS,
            "status":       "insufficient_data",
        }

    # ── Train Random Forest ──────────────────────────────────────
    n_estimators = min(200, max(50, len(X) * 2))

    model = RandomForestRegressor(
        n_estimators  = n_estimators,
        max_depth     = None,
        min_samples_leaf = 2,
        max_features  = "sqrt",
        random_state  = 42,
        n_jobs        = -1,
    )
    model.fit(X, y)

    # ── Optional cross-val score (only if enough rows) ──────────
    cv_rmse = None
    if len(X) >= 10:
        try:
            cv_splits = min(5, len(X) // 2)
            scores = cross_val_score(
                model, X, y,
                cv      = cv_splits,
                scoring = "neg_root_mean_squared_error",
                n_jobs  = -1,
            )
            cv_rmse = round(float(-scores.mean()), 4)
        except Exception:
            pass

    # ── Save to cache ────────────────────────────────────────────
    now = datetime.utcnow().isoformat()
    joblib.dump(model, cache)
    joblib.dump({
        "trained_at":       now,
        "trained_on_rows":  row_count,
        "cv_rmse":          cv_rmse,
        "uid":              uid,
        "product_id":       product_id,
    }, meta_p)

    return {
        "model":        model,
        "trained_at":   now,
        "rows_used":    row_count,
        "cv_rmse":      cv_rmse,
        "feature_cols": FEATURE_COLS,
        "status":       "trained",
    }


def get_model_info(uid: str, product_id: str, history_count: int) -> dict:
    """
    Return metadata about a cached model without loading it.
    Used by the /train status endpoint.
    """
    meta_p = _meta_path(uid, product_id)
    cache  = _cache_path(uid, product_id)

    if not os.path.exists(cache) or not os.path.exists(meta_p):
        needs_train = history_count >= MIN_ROWS
        return {
            "cached":       False,
            "needs_train":  needs_train,
            "rows_used":    0,
            "trained_at":   None,
            "cv_rmse":      None,
        }

    meta = joblib.load(meta_p)
    needs_retrain = _should_retrain(meta, history_count)

    return {
        "cached":       True,
        "needs_train":  needs_retrain,
        "rows_used":    meta.get("trained_on_rows", 0),
        "trained_at":   meta.get("trained_at"),
        "cv_rmse":      meta.get("cv_rmse"),
    }


def invalidate_cache(uid: str, product_id: str):
    """Force-remove cached model so next prediction retrains."""
    for path in [_cache_path(uid, product_id), _meta_path(uid, product_id)]:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass