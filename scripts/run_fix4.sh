#!/bin/bash
# Run FIX-4 pipeline locally
set -euo pipefail

WORK_DIR="${1:-KIS/Work/current}"
PYTHON="${PYTHON:-python}"

echo "Running FIX-4 pipeline for: $WORK_DIR"
echo "======================================="

# Ensure work directory exists
mkdir -p "$WORK_DIR"

# Run each engine in sequence
engines=(
    "enclosure_solver"
    "breaker_placer"
    "breaker_critic"
    "estimate_formatter"
    "cover_tab_writer"
    "doc_lint_guard"
)

SUCCESS=0
for engine in "${engines[@]}"; do
    echo -n "Running $engine... "
    if [ "$engine" = "estimate_formatter" ]; then
        if $PYTHON engine/${engine}.py --work "$WORK_DIR" --templates KIS/Templates 2>/dev/null; then
            echo "OK"
        else
            echo "FAIL"
            SUCCESS=1
        fi
    else
        if $PYTHON engine/${engine}.py --work "$WORK_DIR" 2>/dev/null; then
            echo "OK"
        else
            echo "FAIL"
            SUCCESS=1
        fi
    fi
done

echo "======================================="
if [ $SUCCESS -eq 0 ]; then
    echo "Pipeline completed successfully"
else
    echo "Pipeline completed with errors"
fi

exit $SUCCESS