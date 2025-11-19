# config/database.py
"""
Database configuration for the project (Postgres / Neon only).

This file intentionally **does not** include any SQLite fallback.
It exposes:
 - Base        : declarative base (use in models)
 - FastModel   : alias to Base (keeps compatibility with older imports)
 - engine      : SQLAlchemy Engine
 - SessionLocal: sessionmaker factory
 - get_db()    : dependency generator for FastAPI
 - init_models(): optional helper to create tables (prefer Alembic for migrations)
"""

from typing import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config.settings import DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not configured. Set it in config.settings or your environment (.env).")

# Create a single declarative base. Many modules import either `Base` or `FastModel`
# so we'll point both names to the same class for compatibility.
Base = declarative_base()
FastModel = Base  # alias for backward compatibility with older code

# Engine configuration
# - keep pool_pre_ping True to avoid stale connections
# - pass sslmode=require in connect_args for Neon (if your DATABASE_URL already contains sslmode param this will be harmless)
# - you can tune poolclass / pool_size if needed for production
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"},
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """
    FastAPI dependency to provide a DB session and close after use.

    Usage:
        from config.database import get_db
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_models() -> None:
    """
    Optional helper to create tables from SQLAlchemy models using Base.metadata.
    Prefer using Alembic for migrations in production; this helper is handy for quick local testing.

    WARNING: Calling this in production without understanding migrations can be destructive.
    """
    Base.metadata.create_all(bind=engine)
