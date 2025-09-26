FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=UTC

WORKDIR /app

COPY api/pyproject.toml /app/api/pyproject.toml
COPY api/.env.example /app/api/.env.example
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir fastapi uvicorn[standard] sqlmodel asyncpg alembic pydantic-settings python-multipart structlog rich passlib[bcrypt] pyjwt

COPY api /app/api
COPY spec /app/spec

EXPOSE 8080

CMD ["uvicorn", "kis_backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
