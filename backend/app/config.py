from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv() 

_BACKEND_DIR = Path(__file__).parent.parent
_ENV_FILE_PATH = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""
    
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE_PATH) if _ENV_FILE_PATH.exists() else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        env_ignore_empty=True,
    )

    ENV: str = "dev"
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    AUTO_CREATE_TABLES: bool = False

settings = Settings()


# if __name__ == "__main__":
#     print("Environment:", settings.ENV)
#     print("Database URL:", settings.DATABASE_URL)
