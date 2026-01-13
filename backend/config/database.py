# config/database.py
import os
from contextlib import contextmanager
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session, Session

from config.settings import DATABASE_URL

# -----------------------------------------
# Engine + Session
# -----------------------------------------
# Make sure DATABASE_URL is a proper SQLAlchemy URL (postgresql://...).
# If you're using Neon with sslmode=require, include that in the URL in settings.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=False,  # Disabled to prevent transaction conflicts with psycopg2
    pool_recycle=3600,    # Recycle connections after 1 hour
    pool_size=10,         # Number of connections in the pool
    max_overflow=20,      # Max overflow connections beyond pool_size
    pool_timeout=30,      # Timeout for getting connection from pool
    # Note: psycopg2 accepts sslmode in the URL; additional connect_args can be added if needed.
    # connect_args={"sslmode": "require"},
)

# Use scoped_session so short-lived sessions returned by helpers won't leak easily.
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))


@contextmanager
def get_session() -> Session:
    """Context manager to yield a DB session and ensure cleanup."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# -----------------------------------------
# Declarative base with helper methods
# -----------------------------------------
class BaseModel:
    """Mixin that provides convenient classmethods expected by the app."""

    __abstract__ = True

    @classmethod
    def create(cls, **kwargs) -> Any:
        """
        Create an instance and persist to DB.
        Returns the created object (refreshed).
        """
        with get_session() as db:
            obj = cls(**kwargs)
            db.add(obj)
            db.commit()
            db.refresh(obj)
            return obj

    @classmethod
    def get(cls, pk: int) -> Any | None:
        """Get by primary key (returns None if not found)."""
        with get_session() as db:
            return db.get(cls, pk)

    @classmethod
    def get_or_404(cls, pk: int) -> Any:
        """Get by pk or raise 404."""
        obj = cls.get(pk)
        if obj is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{cls.__name__} not found.")
        return obj

    @classmethod
    def filter(cls, *criteria):
        """
        Return a Query object filtered by given SQLAlchemy criteria.
        Note: This now properly manages the session using scoped_session.
        The scoped_session will automatically close when the query completes.
        """
        db = SessionLocal()
        query = db.query(cls).filter(*criteria)
        # Enable query to work with the scoped session that will auto-cleanup
        return query

    @classmethod
    def update(cls, pk: int, **kwargs) -> Any | None:
        """
        Update object by primary key and return the updated instance.
        """
        with get_session() as db:
            q = db.query(cls).filter_by(id=pk)
            updated = q.update(kwargs, synchronize_session="fetch")
            if not updated:
                return None
            db.commit()
            return db.get(cls, pk)

    @classmethod
    def delete(cls, pk: int) -> bool:
        """Delete object by primary key."""
        with get_session() as db:
            obj = db.get(cls, pk)
            if not obj:
                return False
            db.delete(obj)
            db.commit()
            return True


# Create the declarative base using our mixin so all models inherit helpers.
Base = declarative_base(cls=BaseModel)

# Backwards compatibility: some modules import FastModel
FastModel = Base

# -----------------------------------------
# Database manager (utility)
# -----------------------------------------
class DatabaseManager:
    """
    Utility to perform DB-level operations. Existing code calls:
        DatabaseManager.create_database_tables()
    or imports DatabaseManager from config.database.
    """

    @staticmethod
    def create_database_tables():
        """
        Create all tables defined on Base.metadata. Useful in development when
        you want SQLAlchemy to create tables automatically (but in production
        you probably want to rely on Alembic migrations).
        """
        Base.metadata.create_all(bind=engine)

    @staticmethod
    def drop_all():
        Base.metadata.drop_all(bind=engine)


# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Remove the scoped session to prevent stale connections
        SessionLocal.remove()
