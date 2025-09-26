#!/bin/bash
# MCP Gateway Smoke Test Script

set -e

# Configuration
GATEWAY_URL=${GATEWAY_URL:-"http://localhost:8080"}
VERBOSE=${VERBOSE:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Health Check Test
test_health() {
    log_info "Testing health endpoint..."

    response=$(curl -s -w "\n%{http_code}" "${GATEWAY_URL}/health" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        log_info "✓ Health check passed (HTTP $http_code)"
        if [ "$VERBOSE" = true ]; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
        return 0
    else
        log_error "✗ Health check failed (HTTP $http_code)"
        return 1
    fi
}

# JSON-RPC Ping Test
test_ping() {
    log_info "Testing JSON-RPC ping..."

    request_body='{"jsonrpc":"2.0","method":"ping","params":{},"id":"smoke-test"}'

    response=$(curl -s -w "\n%{http_code}" -X POST "${GATEWAY_URL}/mcp/gateway" \
        -H "Content-Type: application/json" \
        -d "$request_body" 2>/dev/null)

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "pong"; then
            log_info "✓ JSON-RPC ping passed"
            if [ "$VERBOSE" = true ]; then
                echo "$body" | jq '.' 2>/dev/null || echo "$body"
            fi
            return 0
        else
            log_error "✗ JSON-RPC ping failed - no pong in response"
            return 1
        fi
    else
        log_error "✗ JSON-RPC ping failed (HTTP $http_code)"
        return 1
    fi
}

# WebSocket Test (optional)
test_websocket() {
    log_info "Testing WebSocket connection..."

    if ! command -v wscat &> /dev/null; then
        log_warn "wscat not installed, skipping WebSocket test"
        log_warn "Install with: npm install -g wscat"
        return 0
    fi

    # Test WebSocket ping-pong
    timeout 5 wscat -c "ws://$(echo $GATEWAY_URL | sed 's|http://||')/mcp/gateway/stream" \
        -x '{"type":"ping"}' \
        -w 1 2>/dev/null | grep -q "pong"

    if [ $? -eq 0 ]; then
        log_info "✓ WebSocket test passed"
        return 0
    else
        log_warn "⚠ WebSocket test failed or timed out"
        return 1
    fi
}

# Supabase Connection Test (if configured)
test_supabase() {
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
        log_warn "Supabase environment variables not set, skipping test"
        return 0
    fi

    log_info "Testing Supabase connection..."

    response=$(curl -s -w "\n%{http_code}" "${SUPABASE_URL}/rest/v1/" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" 2>/dev/null)

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        log_info "✓ Supabase connection test passed"
        return 0
    else
        log_error "✗ Supabase connection test failed (HTTP $http_code)"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting MCP Gateway smoke tests..."
    log_info "Target URL: $GATEWAY_URL"
    echo ""

    total_tests=0
    passed_tests=0

    # Run tests
    if test_health; then
        ((passed_tests++))
    fi
    ((total_tests++))

    if test_ping; then
        ((passed_tests++))
    fi
    ((total_tests++))

    if test_websocket; then
        ((passed_tests++))
    fi
    ((total_tests++))

    if test_supabase; then
        ((passed_tests++))
    fi
    ((total_tests++))

    # Summary
    echo ""
    log_info "Test Summary: $passed_tests/$total_tests passed"

    if [ $passed_tests -eq $total_tests ]; then
        log_info "✓ All smoke tests passed!"
        exit 0
    else
        log_error "✗ Some tests failed"
        exit 1
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            GATEWAY_URL="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--url URL] [--verbose]"
            echo "  --url URL    Gateway URL (default: http://localhost:8080)"
            echo "  --verbose    Show detailed output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main
main