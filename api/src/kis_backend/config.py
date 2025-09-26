from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore")

    app_env: str = "dev"
    app_name: str = "KIS Backend API"
    api_host: str = "0.0.0.0"
    api_port: int = 8080
    db_kind: str = "postgres"
    database_url: str = "postgresql+asyncpg://kis:kis@localhost:5432/kis"
    test_database_url: Optional[str] = None
    jwt_secret: str = "dev_secret_change_me"
    jwt_issuer: str = "kis-core"
    allowed_origins: str = "http://localhost:3000"
    log_level: str = "INFO"
    tz: str = "UTC"

    @field_validator("database_url", mode="before")
    @classmethod
    def ensure_async_driver(cls, value: str) -> str:
        if value.startswith("postgresql+psycopg://"):
            return value.replace("postgresql+psycopg://", "postgresql+psycopg_async://", 1)
        return value


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    return AppSettings()
