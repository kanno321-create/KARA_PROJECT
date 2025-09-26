#!/bin/bash
# normalize_workflows.sh - Normalize GitHub Actions workflow files
# Purpose: UTF-8(no BOM)+LF normalization, smart quote replacement, yamllint validation
# Output: Evidence artifacts in out/WORKFLOW_NORMALIZE_${UTC_TS}/

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKFLOWS_DIR="$PROJECT_ROOT/.github/workflows"
UTC_TS=$(date -u +"%Y%m%d_%H%M%S")
OUT_DIR="$PROJECT_ROOT/out/WORKFLOW_NORMALIZE_${UTC_TS}"
YAMLLINT_CONFIG="$PROJECT_ROOT/.yamllint"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUT_DIR"

# Logging function
log() {
    local level="$1"
    shift
    echo -e "[$(date -u +"%Y-%m-%d %H:%M:%S")][$level] $*" | tee -a "$OUT_DIR/normalize.log"
}

log "INFO" "Starting workflow normalization..."
log "INFO" "UTC timestamp: $UTC_TS"
log "INFO" "Workflows directory: $WORKFLOWS_DIR"
log "INFO" "Output directory: $OUT_DIR"

# Create relaxed yamllint config
cat > "$YAMLLINT_CONFIG" << 'EOF'
---
extends: default
rules:
  line-length:
    max: 120
    level: warning
  truthy:
    allowed-values: ['true', 'false', 'on', 'off', 'yes', 'no']
  comments:
    min-spaces-from-content: 1
  indentation:
    spaces: 2
    indent-sequences: consistent
  empty-lines:
    max: 2
  trailing-spaces: enable
  new-line-at-end-of-file: enable
  document-start: disable
  brackets:
    max-spaces-inside: 1
EOF

log "INFO" "Created yamllint config at $YAMLLINT_CONFIG"

# Find all workflow files
WORKFLOW_FILES=()
for file in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
    [ -f "$file" ] && WORKFLOW_FILES+=("$file")
done

if [ ${#WORKFLOW_FILES[@]} -eq 0 ]; then
    log "ERROR" "No workflow files found in $WORKFLOWS_DIR"
    exit 1
fi

log "INFO" "Found ${#WORKFLOW_FILES[@]} workflow files"

# Process each workflow file
NORMALIZED_COUNT=0
FAILED_COUNT=0

for workflow_file in "${WORKFLOW_FILES[@]}"; do
    filename=$(basename "$workflow_file")
    log "INFO" "Processing: $filename"

    # Create backup
    cp "$workflow_file" "$OUT_DIR/${filename}.backup"

    # Calculate original hash
    original_hash=$(sha256sum "$workflow_file" | cut -d' ' -f1)
    echo "$original_hash  $filename (original)" >> "$OUT_DIR/checksums.txt"

    # Normalize using our Python script
    if python "$SCRIPT_DIR/_utf8_normalize.py" "$workflow_file" 2>>"$OUT_DIR/normalize.log"; then
        # Calculate new hash
        new_hash=$(sha256sum "$workflow_file" | cut -d' ' -f1)
        echo "$new_hash  $filename (normalized)" >> "$OUT_DIR/checksums.txt"

        if [ "$original_hash" != "$new_hash" ]; then
            log "INFO" "  ✓ File normalized (hash changed)"
            NORMALIZED_COUNT=$((NORMALIZED_COUNT + 1))

            # Generate diff
            diff -u "$OUT_DIR/${filename}.backup" "$workflow_file" > "$OUT_DIR/${filename}.diff" 2>/dev/null || true
        else
            log "INFO" "  - File already normalized (no changes)"
        fi
    else
        log "ERROR" "  ✗ Failed to normalize $filename"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        # Restore from backup
        cp "$OUT_DIR/${filename}.backup" "$workflow_file"
    fi
done

log "INFO" "Normalization complete: $NORMALIZED_COUNT files changed, $FAILED_COUNT failed"

# Run yamllint validation
log "INFO" "Running yamllint validation..."
YAMLLINT_OUTPUT="$OUT_DIR/yamllint_results.txt"
YAMLLINT_FAILED=0

for workflow_file in "${WORKFLOW_FILES[@]}"; do
    filename=$(basename "$workflow_file")
    echo "=== $filename ===" >> "$YAMLLINT_OUTPUT"

    if yamllint -c "$YAMLLINT_CONFIG" "$workflow_file" >> "$YAMLLINT_OUTPUT" 2>&1; then
        log "INFO" "  ✓ $filename: yamllint passed"
        echo "PASS" >> "$YAMLLINT_OUTPUT"
    else
        log "WARNING" "  ⚠ $filename: yamllint warnings/errors"
        echo "FAIL" >> "$YAMLLINT_OUTPUT"
        YAMLLINT_FAILED=$((YAMLLINT_FAILED + 1))
    fi
    echo "" >> "$YAMLLINT_OUTPUT"
done

# Generate summary report
cat > "$OUT_DIR/summary.json" << EOF
{
  "utc_ts": "$UTC_TS",
  "workflows_found": ${#WORKFLOW_FILES[@]},
  "normalized": $NORMALIZED_COUNT,
  "failed": $FAILED_COUNT,
  "yamllint_issues": $YAMLLINT_FAILED,
  "artifacts": {
    "checksums": "checksums.txt",
    "yamllint_results": "yamllint_results.txt",
    "normalize_log": "normalize.log"
  }
}
EOF

# Display summary
log "INFO" "${GREEN}=== Normalization Summary ===${NC}"
log "INFO" "Total workflow files: ${#WORKFLOW_FILES[@]}"
log "INFO" "Files normalized: $NORMALIZED_COUNT"
log "INFO" "Normalization failures: $FAILED_COUNT"
log "INFO" "Yamllint issues: $YAMLLINT_FAILED"
log "INFO" "Evidence artifacts: $OUT_DIR"
log "INFO" "Summary: $OUT_DIR/summary.json"

# Exit with appropriate code
if [ $FAILED_COUNT -gt 0 ]; then
    exit 1
elif [ $YAMLLINT_FAILED -gt 0 ]; then
    exit 2  # Warning exit code for yamllint issues
else
    exit 0
fi