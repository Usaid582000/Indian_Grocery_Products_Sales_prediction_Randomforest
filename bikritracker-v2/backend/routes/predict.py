"""
POST /predict — main prediction endpoint
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from ..firebase_client import get_user_product
from ..ml.predictor import predict as run_predict

router = APIRouter()


class PredictRequest(BaseModel):
    product_id:   str
    predict_date: str | None = None   # ISO date string YYYY-MM-DD
    force_retrain: bool = False


@router.post("/predict")
async def predict_sales(req: PredictRequest, x_user_id: str = Header(...)):
    """
    1. Fetch product + history from Firestore
    2. Train (or load cached) model
    3. Return prediction with confidence interval
    """
    uid = x_user_id.strip()
    if not uid:
        raise HTTPException(400, "x-user-id header is required")

    product = get_user_product(uid, req.product_id)
    if not product:
        raise HTTPException(404, f"Product {req.product_id} not found")

    history = product.get("history", [])

    result = run_predict(
        uid          = uid,
        product_id   = req.product_id,
        history      = history,
        predict_date = req.predict_date,
        force_retrain = req.force_retrain,
    )

    if result.get("error"):
        code = result.get("error_code", "UNKNOWN")
        msg  = result.get("message", "Prediction failed")

        if code == "INSUFFICIENT_DATA":
            raise HTTPException(422, detail={"code": code, "message": msg, "rows_used": result.get("rows_used")})

        raise HTTPException(500, detail={"code": code, "message": msg})

    return result