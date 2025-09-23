#!/bin/bash
#
# KIS v2.0 Foundation Mode Verification
# Ensures no production code or network calls
#

set -e

echo "========================================="
echo "KIS v2.0 Foundation Mode Verification"
echo "========================================="

ERRORS=0

# Check environment variables
echo -n "Checking FEATURE_PROD_ENABLED... "
if [ "${FEATURE_PROD_ENABLED}" = "1" ]; then
    echo "❌ FAIL (set to 1, should be 0)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ OK (disabled)"
fi

echo -n "Checking NO_NETWORK flag... "
if [ "${NO_NETWORK}" != "1" ]; then
    echo "❌ FAIL (network not blocked)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ OK (network blocked)"
fi

# Check for deployment attempts
echo -n "Checking for deployment files... "
if ls dist/ 2>/dev/null || ls build/ 2>/dev/null; then
    echo "❌ FAIL (build artifacts found)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ OK (no builds)"
fi

# Check for external network calls in Python files
echo -n "Checking for network calls... "
NETWORK_CALLS=$(grep -r "requests\|urllib\|httpx\|aiohttp" --include="*.py" . 2>/dev/null | grep -v "^#" | wc -l || true)
if [ "$NETWORK_CALLS" -gt 0 ]; then
    echo "❌ FAIL (found $NETWORK_CALLS network call references)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ OK (no network calls)"
fi

# Check for implementation additions to engines
echo -n "Checking engine modifications... "
ENGINE_FILES=$(find engine -name "*.py" -newer .meta/baseline_timestamp 2>/dev/null | wc -l || true)
if [ "$ENGINE_FILES" -gt 0 ]; then
    echo "⚠️  WARNING ($ENGINE_FILES files modified)"
fi

# Check Templates/Rules protection
echo -n "Checking Templates/Rules protection... "
if [ -w "KIS/Templates" ] && [ "${WRITE_PROTECT_TEMPLATES}" = "1" ]; then
    echo "❌ FAIL (Templates should be write-protected)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ OK"
fi

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ FOUNDATION MODE VERIFIED"
    exit 0
else
    echo "❌ FOUNDATION MODE VIOLATIONS: $ERRORS"
    exit 1
fi