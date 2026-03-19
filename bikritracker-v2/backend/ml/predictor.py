"""
Run a prediction for a specific product + date.
Trains (or loads) the model then builds the feature row.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from .trainer import train_product_model
from .feature_builder import history_to_df, build_prediction_row


def predict(
    uid: str,
    product_id: str,
    history: list[dict],
    predict_date: str | None = None,
    force_retrain: bool = False,
) -> dict:
    """
    Full predict pipeline:
      1. Train / load model
      2. Build feature row for predict_date
      3. Run model.predict
      4. Build confidence interval from tree spread

    Returns a dict matching the shape the frontend expects.
    """

    # ── Resolve prediction date ──────────────────────────────────
    if predict_date:
        try:
            pred_date = pd.to_datetime(predict_date)
        except Exception:
            pred_date = pd.Timestamp.utcnow() + pd.DateOffset(months=1)
    else:
        pred_date = pd.Timestamp.utcnow() + pd.DateOffset(months=1)

    # ── Train / load model ───────────────────────────────────────
    result = train_product_model(
        uid, product_id, history, force=force_retrain
    )

    if result["status"] == "insufficient_data":
        return {
            "error":         True,
            "error_code":    "INSUFFICIENT_DATA",
            "message":       (
                f"Need at least {_MIN_ROWS()} history entries to predict. "
                f"Currently have {result['rows_used']}."
            ),
            "rows_used":     result["rows_used"],
            "model_status":  result["status"],
        }

    model = result["model"]

    # ── Build feature row ────────────────────────────────────────
    df = history_to_df(history)
    X  = build_prediction_row(df, pred_date)

    if X is None:
        return {
            "error":      True,
            "error_code": "FEATURE_BUILD_FAILED",
            "message":    "Could not build prediction features from history.",
        }

    # ── Run prediction ───────────────────────────────────────────
    try:
        pred_log = model.predict(X)[0]
    except Exception as e:
        return {
            "error":      True,
            "error_code": "MODEL_ERROR",
            "message":    str(e),
        }

    pred_sales = float(np.expm1(pred_log))

    # ── Confidence interval from individual tree predictions ─────
    estimators = getattr(model, "estimators_", [])
    if estimators:
        tree_preds = np.array([t.predict(X)[0] for t in estimators])
        tree_sales = np.expm1(tree_preds)
        median     = float(np.median(tree_sales))
        std        = float(np.std(tree_sales, ddof=0))
        lower      = max(0.0, round(median - 1.96 * std, 2))
        upper      = round(median + 1.96 * std, 2)
        uncertainty_pct = (
            round(std / (median + 1e-9) * 100, 1)
            if median > 0 else None
        )
        central = round(median, 2)
    else:
        lower   = round(pred_sales * 0.85, 2)
        upper   = round(pred_sales * 1.15, 2)
        uncertainty_pct = None
        central = round(pred_sales, 2)

    # ── Simple accuracy proxy (SMAPE on last 7 actuals) ──────────
    smape = _estimate_smape(model, df)

    return {
        "error":               False,
        "prediction":          round(pred_sales, 2),
        "central":             central,
        "lower_bound":         lower,
        "upper_bound":         upper,
        "prediction_date":     pred_date.strftime("%Y-%m-%d"),
        "model_status":        result["status"],
        "trained_at":          result["trained_at"],
        "rows_used":           result["rows_used"],
        "cv_rmse":             result["cv_rmse"],
        "uncertainty_pct":     uncertainty_pct,
        "estimated_accuracy":  smape,
    }


def _MIN_ROWS():
    import os
    return int(os.getenv("MIN_HISTORY_ROWS", "5"))


def _estimate_smape(model, df: pd.DataFrame) -> float | None:
    """
    Walk-forward SMAPE on the last min(7, n//3) history rows.
    Returns an estimated accuracy % (100 - avg SMAPE%).
    """
    from .feature_builder import build_features, FEATURE_COLS

    if len(df) < 6:
        return None

    n_test   = min(7, len(df) // 3)
    n_train  = len(df) - n_test

    errors = []
    for i in range(n_test):
        train_df = df.iloc[: n_train + i]
        actual   = float(df.iloc[n_train + i]["sales"])
        pred_row = build_prediction_row(train_df, df.iloc[n_train + i]["orderDate"])
        if pred_row is None:
            continue
        try:
            pred_log   = model.predict(pred_row)[0]
            pred_sales = float(np.expm1(pred_log))
        except Exception:
            continue

        denom = (abs(actual) + abs(pred_sales)) / 2
        if denom > 0:
            errors.append(abs(actual - pred_sales) / denom * 100)

    if not errors:
        return None

    avg_smape = sum(errors) / len(errors)
    accuracy  = max(0, round(100 - avg_smape, 1))
    return accuracy