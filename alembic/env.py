# alembic/env.py
import os
import sys
from logging.config import fileConfig
from pathlib import Path


# ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection

# Force-import all models so metadata is populated
from apps.accounts import models as accounts_models
from apps.products import models as products_models
from apps.attributes import models as attributes_models

from config.database import Base
target_metadata = Base.metadata

# load dotenv from project root if present
from dotenv import load_dotenv
env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))

# Alembic config and logging
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Get DATABASE_URL from environment (Neon)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found — ensure `.env` is loaded before running alembic.")

# Provide the DB url to alembic config (some tools expect it in sqlalchemy.url)
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Import application's Base and ensure models are imported so metadata is populated
from config.database import Base  # noqa: E402

# Import all models modules from apps so they register with Base.metadata
apps_dir = PROJECT_ROOT / "apps"
if apps_dir.exists():
    for app_dir in apps_dir.iterdir():
        if app_dir.is_dir():
            models_file = app_dir / "models.py"
            if models_file.exists():
                try:
                    __import__(f"apps.{app_dir.name}.models")
                except Exception:
                    # model import may fail during autogenerate if it relies on unavailable deps;
                    # in that case autogenerate will use whatever metadata is available.
                    pass


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode using a fresh Engine."""
    connect_args = {"sslmode": "require"}

    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
