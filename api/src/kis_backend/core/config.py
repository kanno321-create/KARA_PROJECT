"""Application settings."""
from __future__ import annotations

import functools
from typing import Optional

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = Field(default="KIS Backend")
    api_port: int = Field(default=8080)
    database_url: str = Field(default="sqlite+aiosqlite:///./kis_dev.db")
    log_level: str = Field(default="INFO")
    allowed_origins: str = Field(default="http://localhost:3000")

    class Config:
        env_prefix = "KIS_"
        env_file = ".env"


@functools.lru_cache
def get_settings() -> Settings:
    return Settings()
