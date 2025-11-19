# apps/main.py
import logging

from fastapi import FastAPI

from config.routers import RouterManager
from config.database import DatabaseManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fastapi_app")

app = FastAPI(title="FastAPI Shop", version="0.1.0")


@app.on_event("startup")
def startup_event():
    # Import routers and include them
    RouterManager(app).import_routers()
    # Optionally ensure tables exist in DB (useful in dev). If using Alembic migrations
    # exclusively you may remove the next line.
    try:
        DatabaseManager.create_database_tables()
        logger.info("Ensured DB tables exist (SQLAlchemy create_all).")
    except Exception as e:
        logger.warning(f"create_database_tables() failed: {e}")


@app.get("/")
def health():
    return {"status": "ok"}
