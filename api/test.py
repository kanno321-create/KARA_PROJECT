"""
Simple test handler for Vercel
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
async def root():
    return JSONResponse(
        content={
            "status": "ok",
            "message": "Test handler working"
        }
    )

@app.get("/health")
async def health():
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "mcp-gateway-test"
        }
    )

# Export handler for Vercel
handler = app