from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    ENV: str = "dev"
    DATABASE_URL: str  
    AUTO_CREATE_TABLES: bool = True


settings = Settings()

if __name__ == "__main__":
    print(settings.DATABASE_URL)