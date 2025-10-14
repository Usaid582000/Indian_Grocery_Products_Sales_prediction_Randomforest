# scripts/generate_popular_products.py
"""
Generate a small set of 'popular product templates' from your CSV so the
frontend home page can show a few static examples.

Usage:
  python scripts/generate_popular_products.py --csv /path/to/supermarket-sales.csv --out frontend/public/popular_templates.json
"""
import argparse
import pandas as pd
import json
import os
import numpy as np

def main(args):
    df = pd.read_csv(args.csv)
    # normalize column names
    cols = {c.strip(): c for c in df.columns}
    # ensure minimal columns exist
    if "Category" not in df.columns or "Subcategory" not in df.columns or "Sales" not in df.columns:
        raise RuntimeError("CSV must include Category, Subcategory and Sales columns.")
    # pick most frequent product groups (Category + Subcategory) by count and average sales
    df = df.dropna(subset=["Category", "Subcategory"])
    grp = df.groupby(["Category", "Subcategory"]).agg(
        count=("Sales", "count"),
        avg_sales=("Sales", lambda s: pd.to_numeric(s, errors="coerce").mean() if len(s) else np.nan),
    ).reset_index().sort_values(["count", "avg_sales"], ascending=[False, False])

    templates = []
    for _, row in grp.head(8).iterrows():
        # create a plausible price: round(avg_sales / 10) fallback if nan
        avg = row["avg_sales"]
        price = 50
        try:
            if not np.isnan(avg) and avg > 0:
                # choose price as something reasonable relative to avg sale (not exact science)
                price = max(10, round(avg / 8.0))
        except Exception:
            price = 50
        templates.append({
            "name": f"{row['Subcategory']} ({row['Category']})",
            "category": row["Category"],
            "subcategory": row["Subcategory"],
            "price": int(price),
            "sample_note": f"Avg sale: {round(row['avg_sales'] or 0):,} (count {int(row['count'])})"
        })

    out = args.out
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(templates, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(templates)} templates to {out}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True, help="Path to supermarket-sales.csv")
    ap.add_argument("--out", default="frontend/public/popular_templates.json", help="Output JSON (public folder)")
    args = ap.parse_args()
    main(args)
