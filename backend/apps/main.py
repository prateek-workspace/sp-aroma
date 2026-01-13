# apps/main.py
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config.routers import RouterManager
from config.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fastapi_app")

app = FastAPI(
    title="FastAPI Shop",
    version="0.1.0",
    redirect_slashes=False,   # ⬅️ VERY IMPORTANT (prevents 307)
)

# ✅ Database session cleanup middleware
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    finally:
        # Clean up scoped session after each request to prevent stale connections
        SessionLocal.remove()

# ✅ CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sp-aroma.pages.dev",
        "https://sp-aroma.com",
        "https://www.sp-aroma.com",
        "https://sp-aroma.onrender.com",  # Backend itself for testing
        "http://localhost:5173",          # local dev
        "http://127.0.0.1:5173",          # local dev (IP)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    RouterManager(app).import_routers()
    logger.info("Routers loaded successfully.")

@app.get("/")
def health():
    return {"status": "ok"}
