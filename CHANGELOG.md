# Changelog

## [v3.0.1-sse-hotfix] - 2025-09-27

### Added
- feat(sse): Meta None multi-layer defense, heartbeat seq, timeout gate(15s)
- tests: add regression `SSE-HEARTBEAT-META-NONE`
- ops: add metrics/log fields for SSE/WS

### Fixed
- fix(sse): Prevent SSE hanging when BaseEvent.meta is None
- fix(sse): Ensure heartbeat events always include seq metadata
- fix(events): Add timeout gate to prevent infinite hanging in tests

### Security
- Improved error handling in SSE streams
- Enhanced event validation and sanitization

---

## [v3.0.0] - 2025-09-26

### Added
- Complete Phase 1 & 2 validation framework
- OpenAPI 3.1 contract compliance
- UTC timestamp handling with ISO8601 Z format
- Full async/await architecture implementation

### Changed
- Migrated to SQLite + aiosqlite for development
- Enhanced error handling with structured responses
- Improved test coverage to 87.5%

### Fixed
- Database schema timezone handling
- Quote creation and validation workflows
- Health endpoint performance optimization

---