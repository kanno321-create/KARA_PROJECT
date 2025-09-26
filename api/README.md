# KIS Backend API

FastAPI-based service that powers the KIS AI estimator. See `/spec/openapi.yaml` for the contract.

## Quickstart

```bash
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -e .[dev]
uvicorn kis_backend.main:create_app --reload
```

Environment variables are defined in `.env.example`.