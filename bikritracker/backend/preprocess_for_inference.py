# preprocess_for_inference.py
import pandas as pd
import numpy as np

def compute_base_date_features(df, date_col='Orderdate'):
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')
    df['year'] = df[date_col].dt.year
    df['month'] = df[date_col].dt.month
    df['day'] = df[date_col].dt.day
    df['weekday'] = df[date_col].dt.weekday
    df['is_weekend'] = df['weekday'].isin([5,6]).astype(int)
    return df

def build_features(historical_df: pd.DataFrame,
                   request_rows_df: pd.DataFrame,
                   feature_list: list,
                   group_keys=['City','Category','Subcategory'],
                   date_col='Orderdate'):
    """
    Returns X_final DataFrame with columns exactly in feature_list order.
    Raises informative errors if required inputs missing.
    """
    # Basic checks
    if historical_df is None or historical_df.empty:
        raise ValueError("historical_df must be provided and non-empty for lag/rolling computation.")
    if request_rows_df is None or request_rows_df.empty:
        raise ValueError("request_rows_df must contain rows to predict.")

    hist = historical_df.copy()
    req = request_rows_df.copy()

    if 'Sales' not in hist.columns:
        raise ValueError("historical_df must contain column 'Sales' (past sales values).")

    hist = compute_base_date_features(hist, date_col)
    req = compute_base_date_features(req, date_col)

    # Ensure group keys exist
    for k in group_keys:
        if k not in hist.columns:
            hist[k] = np.nan
        if k not in req.columns:
            req[k] = np.nan

    combined = pd.concat([hist, req], ignore_index=True, sort=False).sort_values(date_col)

    def add_lags(g):
        g = g.sort_values(date_col)
        g['sales_lag_1'] = g['Sales'].shift(1)
        g['sales_lag_7'] = g['Sales'].shift(7)
        g['sales_lag_30'] = g['Sales'].shift(30)
        g['sales_roll_7'] = g['Sales'].shift(1).rolling(window=7, min_periods=1).mean()
        g['sales_roll_30'] = g['Sales'].shift(1).rolling(window=30, min_periods=1).mean()
        return g

    combined = combined.groupby(group_keys, dropna=False).apply(add_lags).reset_index(drop=True)

    # mark request rows
    req = req.reset_index(drop=True)
    req['__req_idx'] = req.index
    markers = req[['__req_idx'] + [date_col] + group_keys]
    merged = combined.merge(markers, on=[date_col] + group_keys, how='inner')
    merged = merged.sort_values('__req_idx')

    # one-hot encode categorical columns the same way training did
    merged = pd.get_dummies(merged, columns=["Category", "Subcategory", "City", "Region"], drop_first=True)

    # ensure all feature_list columns exist
    for c in feature_list:
        if c not in merged.columns:
            merged[c] = 0

    X_final = merged[feature_list].astype(float).fillna(0)
    return X_final
