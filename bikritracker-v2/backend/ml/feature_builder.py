"""
Converts a product's history array into a flat feature DataFrame
suitable for scikit-learn.

History items from Firestore:
  { id, orderDate: "YYYY-MM-DD", sales: float }
"""

import pandas as pd
import numpy as np


def history_to_df(history: list[dict]) -> pd.DataFrame:
    """Parse history list into a sorted DataFrame with date + sales."""
    if not history:
        return pd.DataFrame(columns=["orderDate", "sales"])

    rows = []
    for h in history:
        date_raw  = h.get("orderDate") or h.get("Orderdate") or ""
        sales_raw = h.get("sales")     or h.get("Sales")     or 0
        try:
            date = pd.to_datetime(date_raw, errors="coerce")
            if pd.isna(date):
                continue
            rows.append({"orderDate": date, "sales": float(sales_raw)})
        except Exception:
            continue

    if not rows:
        return pd.DataFrame(columns=["orderDate", "sales"])

    df = pd.DataFrame(rows).sort_values("orderDate").reset_index(drop=True)
    return df


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer time-series features from a sorted history DataFrame.

    Input columns:  orderDate (datetime), sales (float)
    Output columns: year, month, day, weekday, is_weekend,
                    lag_1..lag_30, roll_mean_7..roll_mean_30,
                    sales_diff_1, sales_pct_change_7
    """
    df = df.copy()
    df["year"]       = df["orderDate"].dt.year
    df["month"]      = df["orderDate"].dt.month
    df["day"]        = df["orderDate"].dt.day
    df["weekday"]    = df["orderDate"].dt.weekday
    df["is_weekend"] = df["weekday"].isin([5, 6]).astype(int)

    for lag in [1, 7, 14, 30]:
        df[f"lag_{lag}"] = df["sales"].shift(lag)

    df["roll_mean_7"]  = df["sales"].shift(1).rolling(7,  min_periods=1).mean()
    df["roll_mean_14"] = df["sales"].shift(1).rolling(14, min_periods=1).mean()
    df["roll_mean_30"] = df["sales"].shift(1).rolling(30, min_periods=1).mean()

    df["sales_diff_1"]      = df["sales"] - df["sales"].shift(1)
    df["sales_pct_change_7"] = (
        df["sales"] / df["sales"].shift(7) - 1
    ).replace([np.inf, -np.inf], np.nan)

    # target: log1p of sales (stabilises variance)
    df["target"] = np.log1p(df["sales"])

    return df


FEATURE_COLS = [
    "year", "month", "day", "weekday", "is_weekend",
    "lag_1", "lag_7", "lag_14", "lag_30",
    "roll_mean_7", "roll_mean_14", "roll_mean_30",
    "sales_diff_1", "sales_pct_change_7",
]


def get_X_y(df: pd.DataFrame):
    """
    Returns (X, y) dropping rows with NaN in features.
    X is a numpy array, y is 1-D log1p sales.
    """
    feat_df = df[FEATURE_COLS + ["target"]].dropna()
    if feat_df.empty:
        return None, None

    X = feat_df[FEATURE_COLS].values.astype(float)
    y = feat_df["target"].values.astype(float)
    return X, y


def build_prediction_row(df: pd.DataFrame, pred_date: pd.Timestamp) -> np.ndarray | None:
    """
    Build a single feature row for pred_date given the historical df.
    Appends a NaN-sales row for pred_date, re-engineers features,
    returns the last row's feature vector.
    """
    # append prediction row
    new_row = pd.DataFrame([{"orderDate": pred_date, "sales": np.nan}])
    combined = pd.concat([df, new_row], ignore_index=True).sort_values("orderDate")
    combined = combined.reset_index(drop=True)

    # re-engineer features
    combined = build_features(combined)

    # last row = prediction row
    tail = combined.iloc[-1][FEATURE_COLS]

    if tail.isnull().any():
        # fill remaining NaN with column medians from history
        medians = combined.iloc[:-1][FEATURE_COLS].median()
        tail = tail.fillna(medians)

    return tail.values.astype(float).reshape(1, -1)