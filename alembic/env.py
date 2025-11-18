import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool
from dotenv import load_dotenv

# -------------------------------------------------------------------
# Ensure project root is in PYTHONPATH
# -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# -------------------------------------------------------------------
# Load environment variables
# -------------------------------------------------------------------
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Read Alembic Config
config = context.config

# Logging config
if config.config_file_name:
    fileConfig(config.config_file_name)

# -------------------------------------------------------------------
# Import DB Base class
# -------------------------------------------------------------------
from config.database import FastModel

# -------------------------------------------------------------------
# Import all models so Alembic can detect them
# -------------------------------------------------------------------
from apps.accounts.models import *
from apps.attributes.models import *
from apps.products.models import *

# Use FastModel as metadata
target_metadata = FastModel.metadata

# -------------------------------------------------------------------
# DATABASE_URL
# -------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL missing! Add it to .env")

# -------------------------------------------------------------------
# OFFLINE MIGRATIONS
# -------------------------------------------------------------------
def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

# -------------------------------------------------------------------
# ONLINE MIGRATIONS (Neon + SSL)
# -------------------------------------------------------------------
def run_migrations_online() -> None:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"},
        poolclass=pool.NullPool,
    )

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# -------------------------------------------------------------------
# Entrypoint
# -------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
