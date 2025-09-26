# Ops

```bash
# build and start api + postgres
docker-compose -f ops/docker-compose.yml up --build
```

The service exposes the FastAPI app on port 8080. The Postgres database is accessible on port 5432.