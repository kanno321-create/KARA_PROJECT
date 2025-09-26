# KIS Core v2.0 Project Context - Session Loaded

**Session Start**: 2025-09-26
**Project Root**: C:\Users\PC\Desktop\KIS_CORE_V2
**Framework**: Spec-Driven Development (SDD) with Evidence-First approach

## Project Constitution Summary

### Core Principles
- **Spec Kit Absolute Baseline**: All work follows Spec Kit standards
- **SSOT (Single Source of Truth)**: Spec drives implementation and validation
- **Evidence-First**: All outputs include path/hash/timestamp verification
- **Gate-Enforced**: Strict quality gates at each pipeline stage

### FIX-4 Pipeline
1. **Enclosure**: fit_score ≥ 0.90, IP ≥ 44, door clearance ≥ 30mm
2. **Breaker (+Critic)**: phase balance ≤ 3-5%, interference/heat/gap violations = 0
3. **Formatter**: document lint = 0, named ranges intact
4. **Cover**: cover rules 100% compliance
5. **Doc Lint**: final validation pass

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript 5.x (strict), Tailwind 3.x, shadcn/ui
- **Backend**: Python 3.12, Polars, DuckDB, OR-Tools, FastAPI/Flask
- **Office/PDF**: Excel Runner, LibreOffice headless
- **Testing**: Jest/Vitest, pytest, regression harness (20/20 PASS requirement)

## Current Project State

### Active Components
1. **kis-backend/**: Main backend service with Prisma ORM, API endpoints
2. **api/**: API service layer (new, untracked)
3. **frontend/ui**: Multiple UI implementations and templates
4. **spec/**: Specification documents and requirements
5. **tests/**: Comprehensive test suite with regression tests
6. **mcp-servers/**: MCP "Everything" server implementation

### Recent Activity (from git status)
- Modified configuration files (.env.example, CLAUDE.md)
- SLO collector workflow updates
- Backend schema and service modifications
- Multiple deleted build directories and backups
- New untracked directories: api/, mcp/, ops/, spec/, tests/

### Key Workflows
1. **Spec Kit Pipeline**: /constitution → /specify → /plan → /tasks → /implement
2. **Evidence Generation**: All outputs to /output/evidence/{step}/
3. **Regression Testing**: 20 golden test cases must pass
4. **Gate Validation**: Each stage has strict numerical requirements

## Available Commands
- `/kis:fix4-e2e "<request>"`: Run complete FIX-4 pipeline
- `/kis:diff "A B"`: Compare estimates with margin waterfall
- `/kis:regression:run`: Execute all 20 regression test cases
- `/design:polish`: Run Polisher score and A11y checks

## Session Context Established
✅ Project structure analyzed
✅ Constitution and rules loaded
✅ Tech stack and dependencies identified
✅ Active workflows understood
✅ Ready for development tasks

## Next Steps
- Review current git status and pending changes
- Check regression test status
- Validate evidence generation pipeline
- Ensure all gates are operational

---
*Session context loaded successfully. All project rules and constraints are active.*
