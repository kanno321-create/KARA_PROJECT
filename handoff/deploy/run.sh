#!/bin/bash
# KIS Estimator v1 - Minimal startup script

echo "Starting KIS Estimator Gateway..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required"
    exit 1
fi

# Check dependencies
python3 -c "import fastapi, uvicorn" 2>/dev/null || {
    echo "Installing dependencies..."
    pip install fastapi uvicorn
}

# Set environment
export MODE=${MODE:-LIVE}
export PORT=${PORT:-8000}

# Start gateway
echo "Starting on port $PORT in $MODE mode..."
cd /app 2>/dev/null || cd .

python3 -m uvicorn KIS.Tools.gateway.fastmcp_gateway:app \
    --host 0.0.0.0 \
    --port $PORT \
    --reload

# Health check
echo "Health endpoint: http://localhost:$PORT/v1/health"