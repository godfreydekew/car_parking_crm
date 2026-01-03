"""
Application configuration settings.

Supports loading from .env file or environment variables.
Defaults to SQLite database in backend directory.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Compute paths outside the class to avoid Pydantic field issues
_BACKEND_DIR = Path(__file__).parent.parent
_ENV_FILE_PATH = _BACKEND_DIR / ".env"
_DEFAULT_DB_PATH = str(_BACKEND_DIR / "airport_crm.db")


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""
    
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE_PATH) if _ENV_FILE_PATH.exists() else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        env_ignore_empty=True,
    )

    ENV: str = "dev"
    # SQLite database URL (defaults to backend/airport_crm.db)
    # Can be overridden via .env file or DATABASE_URL environment variable
    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB_PATH}"
    AUTO_CREATE_TABLES: bool = False
    # WEBHOOK_SECRET: str


settings = Settings()
