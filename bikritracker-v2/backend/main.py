import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.health  import router as health_router
from routes.train   import router as train_router
from routes.predict import router as predict_router

app = FastAPI(
    title       = "BikriTracker ML API",
    description = "Per-user sales prediction with auto-training",
    version     = "2.0",
)

# ── CORS ─────────────────────────────────────────────────────────
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins     = origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routes ───────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(train_router)
app.include_router(predict_router)


@app.get("/")
def root():
    return {"message": "BikriTracker ML API v2 — see /docs"}