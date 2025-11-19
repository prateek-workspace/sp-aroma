import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr

# Load .env from project root (if present)
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

class AppConfig:
    class _AppConfig(BaseModel):
        app_name: str | None = None
        secret_key: str | None = None
        access_token_expire_minutes: int | None = None
        otp_secret_key: str | None = None
        otp_expire_seconds: int | None = None

    config = _AppConfig(
        app_name=os.getenv("APP_NAME"),
        secret_key=os.getenv("SECRET_KEY"),
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES") or 30),
        otp_secret_key=os.getenv("OTP_SECRET_KEY"),
        otp_expire_seconds=int(os.getenv("OTP_EXPIRE_SECONDS") or 360),
    )

    @classmethod
    def get_config(cls) -> _AppConfig:
        return cls.config


class EmailServiceConfig:
    class _SMTPConfig(BaseModel):
        smtp_server: str | None = None
        smtp_port: int | None = None
        smtp_username: EmailStr | None = None
        smtp_password: str | None = None
        use_local_fallback: bool = False

    config = _SMTPConfig(
        smtp_server=os.getenv("SMTP_SERVER"),
        smtp_port=int(os.getenv("SMTP_PORT") or 587),
        smtp_username=os.getenv("SMTP_USERNAME"),
        smtp_password=os.getenv("SMTP_PASSWORD"),
        use_local_fallback=os.getenv("USE_LOCAL_FALLBACK", "False").lower() == "true",
    )

    @classmethod
    def get_config(cls) -> _SMTPConfig:
        return cls.config


# --- Database (only DATABASE_URL, NO SQLITE fallback) ---
# Set DATABASE_URL in .env or environment. Example:
# DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # fail fast: require DATABASE_URL
    raise RuntimeError("DATABASE_URL not set. Please set it in your .env or environment before starting the app.")

# Optional supabase/neon keys (keep if you use them elsewhere)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


# Media/settings
MEDIA_DIR = BASE_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5
products_list_limit = 12
