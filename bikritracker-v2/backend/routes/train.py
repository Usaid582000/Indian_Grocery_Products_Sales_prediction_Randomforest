"""
POST /train  — trigger (re)training for a specific product
GET  /train/status/{product_id} — check if model is cached and fresh
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from firebase_client import get_user_product
from ml.trainer import train_product_model, get_model_info, invalidate_cache

router = APIRouter()


class TrainRequest(BaseModel):
    product_id: str
    force:      bool = False


@router.post("/train")
async def trigger_train(req: TrainRequest, x_user_id: str = Header(...)):
    """
    Fetch the product from Firestore and train a model for it.
    x-user-id header must be the Firebase UID.
    """
    uid = x_user_id.strip()
    if not uid:
        raise HTTPException(400, "x-user-id header is required")

    product = get_user_product(uid, req.product_id)
    if not product:
        raise HTTPException(404, f"Product {req.product_id} not found for user {uid}")

    history = product.get("history", [])

    result = train_product_model(uid, req.product_id, history, force=req.force)

    return {
        "product_id":  req.product_id,
        "model_status": result["status"],
        "trained_at":   result["trained_at"],
        "rows_used":    result["rows_used"],
        "cv_rmse":      result["cv_rmse"],
    }


@router.get("/train/status/{product_id}")
async def train_status(product_id: str, x_user_id: str = Header(...)):
    uid = x_user_id.strip()
    if not uid:
        raise HTTPException(400, "x-user-id header is required")

    product = get_user_product(uid, product_id)
    if not product:
        raise HTTPException(404, f"Product {product_id} not found")

    count = product.get("historyCount") or len(product.get("history", []))
    info  = get_model_info(uid, product_id, count)

    return {
        "product_id":    product_id,
        "history_count": count,
        **info,
    }


@router.delete("/train/cache/{product_id}")
async def clear_cache(product_id: str, x_user_id: str = Header(...)):
    uid = x_user_id.strip()
    if not uid:
        raise HTTPException(400, "x-user-id header is required")

    invalidate_cache(uid, product_id)
    return {"product_id": product_id, "cache_cleared": True}