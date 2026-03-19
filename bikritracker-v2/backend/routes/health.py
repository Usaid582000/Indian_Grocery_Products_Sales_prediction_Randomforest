from fastapi import APIRouter
import os

router = APIRouter()

@router.get("/health")
def health():
    return {
        "status":    "ok",
        "version":   "2.0",
        "cache_dir": os.getenv("MODEL_CACHE_DIR", "./model_cache"),
    }