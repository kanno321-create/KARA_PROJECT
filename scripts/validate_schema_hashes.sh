#!/usr/bin/env bash
set -euo pipefail

# -------- Config & Defaults --------
SCHEMA_DIRS="${SCHEMA_DIRS:-supabase/migrations api/db schema db}"
SCHEMA_GLOBS="${SCHEMA_GLOBS:-*.sql *.yaml *.yml *.json}"
OUT_DIR="${OUT_DIR:-out}"
EVIDENCE_DIR="${EVIDENCE_DIR:-.evidence/schema_hash}"
ALLOW_DIFF="${ALLOW_DIFF:-false}"

# Hash command (Linux: sha256sum, macOS: shasum -a 256)
if command -v sha256sum >/dev/null 2>&1; then
  HASH_CMD="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  HASH_CMD="shasum -a 256"
else
  echo "❌ No sha256 tool found (sha256sum/shasum). Install coreutils."
  exit 2
fi

UTC_TS="$(date -u +%Y%m%d_%H%M%S)"
OUT_RUN_DIR="${OUT_DIR}/SCHEMA_HASH_${UTC_TS}"
mkdir -p "${OUT_RUN_DIR}" "${EVIDENCE_DIR}"

BASELINE="${EVIDENCE_DIR}/baseline_hashes.txt"
CURRENT="${EVIDENCE_DIR}/current_hashes.txt"
MANIFEST="${OUT_RUN_DIR}/sha256_manifest.txt"
REPORT="${OUT_RUN_DIR}/diff_report.txt"
META="${OUT_RUN_DIR}/run_meta.json"

echo "🔐 Validating schema integrity hashes..."
echo "🕒 UTC_TS=${UTC_TS}"
echo "📂 SCHEMA_DIRS=${SCHEMA_DIRS}"
echo "🎯 PATTERNS=${SCHEMA_GLOBS}"
echo "⚖️  ALLOW_DIFF=${ALLOW_DIFF}"

# -------- Collect candidate files --------
tmp_list="$(mktemp)"
trap 'rm -f "$tmp_list"' EXIT

# find 대상 파일 수집
for dir in ${SCHEMA_DIRS}; do
  [ -d "$dir" ] || continue
  for pat in ${SCHEMA_GLOBS}; do
    # Use while read to handle files with spaces properly
    find "$dir" -type f -name "$pat" 2>/dev/null | while IFS= read -r f; do
      [ -f "$f" ] && printf "%s\n" "$f" >> "$tmp_list"
    done || true
  done
done

# 중복 제거 + 정렬
sort -u "$tmp_list" > "${OUT_RUN_DIR}/files_scanned.txt"
FILE_COUNT="$(wc -l < "${OUT_RUN_DIR}/files_scanned.txt" | tr -d ' ')"
echo "🗃️  Files scanned: ${FILE_COUNT}"

# -------- Compute current hashes --------
rm -f "${CURRENT}" "${MANIFEST}"
touch "${CURRENT}" "${MANIFEST}"

if [ "${FILE_COUNT}" -gt 0 ]; then
  while IFS= read -r path; do
    # 해시 계산 (상대경로 저장 권장)
    rel="${path#./}"
    [ "${rel}" != "${path}" ] || rel="${path}"
    hash_line="$(${HASH_CMD} "${path}")"
    # 표준화: "<hash>  <relpath>" 형식으로 저장
    hash="$(printf "%s" "${hash_line}" | awk '{print $1}')"
    printf "%s  %s\n" "${hash}" "${rel}" >> "${CURRENT}"
    printf "%s  %s\n" "${hash}" "${rel}" >> "${MANIFEST}"
  done < "${OUT_RUN_DIR}/files_scanned.txt"
fi

# 정렬본 생성
sort -k2 "${CURRENT}" > "${CURRENT}.sorted"

# -------- First run (no baseline) --------
if [ ! -f "${BASELINE}" ]; then
  echo "📝 Creating baseline hashes (first run)"
  # 첫 실행: baseline 생성 후 성공 종료
  cp "${CURRENT}.sorted" "${BASELINE}"
  # 메타 기록
  cat > "${META}" <<JSON
{
  "utc_ts": "${UTC_TS}",
  "first_run": true,
  "allow_diff": "${ALLOW_DIFF}",
  "files_scanned": ${FILE_COUNT}
}
JSON
  echo "✅ Baseline created at ${BASELINE}"
  echo "📁 Evidence: ${OUT_RUN_DIR}"
  exit 0
fi

# -------- Compare with baseline --------
sort -k2 "${BASELINE}" > "${BASELINE}.sorted"

# 파일명 기준 조인/비교
cut -d' ' -f3- "${BASELINE}.sorted" > "${OUT_RUN_DIR}/baseline.paths"
cut -d' ' -f3- "${CURRENT}.sorted"  > "${OUT_RUN_DIR}/current.paths"

# added/removed
comm -13 "${OUT_RUN_DIR}/baseline.paths" "${OUT_RUN_DIR}/current.paths" > "${OUT_RUN_DIR}/added.paths"   || true
comm -23 "${OUT_RUN_DIR}/baseline.paths" "${OUT_RUN_DIR}/current.paths" > "${OUT_RUN_DIR}/removed.paths" || true

# changed: 경로는 동일하나 해시가 다른 항목
join -j 1 -o 1.1,1.2,2.2 \
  <(awk '{print $2" "$1" "$2}' "${BASELINE}.sorted" | sort -k1) \
  <(awk '{print $2" "$1" "$2}' "${CURRENT}.sorted"  | sort -k1) \
  | awk '$2 != $3 {print $1"  "$2" -> "$3}' > "${OUT_RUN_DIR}/changed.list" || true

ADDED_CNT=$(wc -l < "${OUT_RUN_DIR}/added.paths"   | tr -d ' ')
REMOVED_CNT=$(wc -l < "${OUT_RUN_DIR}/removed.paths" | tr -d ' ')
CHANGED_CNT=$(wc -l < "${OUT_RUN_DIR}/changed.list" | tr -d ' ')

# -------- Report --------
{
  echo "=== SCHEMA HASH DIFF REPORT @ ${UTC_TS} ==="
  echo "Added:   ${ADDED_CNT}"
  echo "Removed: ${REMOVED_CNT}"
  echo "Changed: ${CHANGED_CNT}"
  echo
  if [ "${ADDED_CNT}" -gt 0 ]; then
    echo "[ADDED]"
    cat "${OUT_RUN_DIR}/added.paths"
    echo
  fi
  if [ "${REMOVED_CNT}" -gt 0 ]; then
    echo "[REMOVED]"
    cat "${OUT_RUN_DIR}/removed.paths"
    echo
  fi
  if [ "${CHANGED_CNT}" -gt 0 ]; then
    echo "[CHANGED] (path  old_hash -> new_hash)"
    cat "${OUT_RUN_DIR}/changed.list"
    echo
  fi
} | tee "${REPORT}"

# 메타 기록
cat > "${META}" <<JSON
{
  "utc_ts": "${UTC_TS}",
  "first_run": false,
  "allow_diff": "${ALLOW_DIFF}",
  "files_scanned": ${FILE_COUNT},
  "added": ${ADDED_CNT},
  "removed": ${REMOVED_CNT},
  "changed": ${CHANGED_CNT},
  "baseline_path": "${BASELINE}",
  "current_path": "${CURRENT}"
}
JSON

# -------- Policy: fail or pass --------
if [ "${ALLOW_DIFF}" = "true" ]; then
  echo "⚠️  Differences detected but ALLOW_DIFF=true → not failing CI."
  echo "📁 Evidence: ${OUT_RUN_DIR}"
  exit 0
else
  if [ $((ADDED_CNT + REMOVED_CNT + CHANGED_CNT)) -gt 0 ]; then
    echo "❌ Differences detected (ALLOW_DIFF=false). Failing CI."
    echo "📁 Evidence: ${OUT_RUN_DIR}"
    exit 1
  else
    echo "✅ No differences. Integrity OK."
    echo "📁 Evidence: ${OUT_RUN_DIR}"
    exit 0
  fi
fi