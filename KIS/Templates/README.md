# KIS Template Registry

- `registry_version`: 1.0.0
- All templates are immutable; update requires new hash entry.
- Named ranges must follow `NR_<SCOPE>_<NAME>` (uppercase, snake).
- File integrity verified via `sha256` stored in `KIS/Rules/policy_tax_margin.yaml` registry section.
- Templates are read-only; copy into `KIS/Work/<case>/input` before editing.
- Validate named ranges before publication via `scripts/overseer_check.py`.

## Registry & Catalog
- registry.json tracks template hashes/named ranges (version 2025.09).
- catalog/enclosures.csv provides enclosure dimensions/IP ratings for solver real logic.
- catalog/breakers.csv provides breaker characteristics for phase balancing.
