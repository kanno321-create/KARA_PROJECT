# FastMCP Specification Manifest
Generated: 2025-09-19 01:43:11

## OpenAPI Specification
- **File**: deploy/fastmcp/openapi_fastmcp.yaml
- **Version**: 1.0.0
- **Endpoint**: `/v1/run` (POST)
- **Actions**: 5 (enclosure, place, format, cover, lint)
- **Schema Validation**: Complete with required fields mapping
- **Error Handling**: 400/500 with structured error responses

## Payload Samples
- **Total Files**: 5
- **Validation Status**: 5/5 PASS
- **Schema Coverage**: 100%

### Sample Files Generated:
1. `enclosure_request.json` - Enclosure solver input (breakers, constraints, panel_specs)
2. `placement_request.json` - Breaker placement input (breakers, panel_specs, constraints)
3. `format_request.json` - Estimate formatting input (estimate, items)
4. `cover_request.json` - Cover generation input (project, financial, enclosure)
5. `lint_request.json` - Document linting input (documents, criteria)

## Mock Server
- **File**: deploy/fastmcp/server.mock.py
- **Purpose**: Input validation and echo responses only
- **Execution**: No actual engine execution (Foundation-Only mode)
- **Validation**: Comprehensive schema validation for all action types
- **Response Time**: ~100ms simulated processing
- **Test Results**: All 5 payload samples validated successfully

## Required Fields Validation
```yaml
enclosure: [breakers, constraints, panel_specs]
place: [breakers, panel_specs, constraints]
format: [estimate, items]
cover: [project, financial]
lint: [documents, criteria]
```

## Static Verification Results
- ✅ Reference integrity: All action schemas defined
- ✅ Required fields: Complete mapping for all 5 actions
- ✅ Sample loading: All JSON samples parse correctly
- ✅ Schema compliance: 100% validation coverage
- ✅ Error handling: Structured error responses implemented

## Foundation-Only Compliance
- No network calls made during specification generation
- No actual engine execution in mock server
- Input validation only, no computation performed
- Safe for RC1 packaging without production concerns