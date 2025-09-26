from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.logging import configure_logging
from .routers import estimate, erp, calendar, mail, ai_manager
from .utils.time import ensure_utc


settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    from .core.database import init_db
    await init_db()


@app.get("/v1/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "timestamp": ensure_utc(datetime.utcnow()).isoformat().replace("+00:00", "Z")}


@app.get("/v1/version")
async def version() -> dict[str, Any]:
    return {"version": app.version}


app.include_router(estimate.router)
app.include_router(erp.router)
app.include_router(calendar.router)
app.include_router(mail.router)
app.include_router(ai_manager.router)
