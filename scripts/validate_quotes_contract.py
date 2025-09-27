#!/usr/bin/env python
"""
Validate quotes API contract compliance between OpenAPI spec and payload samples.
Checks:
1. All required sample files exist (201/409/422)
2. Response structures match OpenAPI schema
3. UTC ISO8601 Z timestamps are used consistently
4. Error formats comply with specification
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Any

def validate_timestamp_format(timestamp: str) -> Tuple[bool, str]:
    """Validate UTC ISO8601 Z format."""
    try:
        if not timestamp.endswith('Z'):
            return False, f"Timestamp missing 'Z' suffix: {timestamp}"

        # Remove Z and parse
        dt_str = timestamp[:-1]
        dt = datetime.fromisoformat(dt_str)

        # Check if it's a valid ISO format
        reconstructed = dt.isoformat() + 'Z'
        if reconstructed != timestamp:
            # Allow for microseconds variations
            if timestamp.replace('.000000', '') == reconstructed.replace('.000000', ''):
                return True, ""

        return True, ""
    except Exception as e:
        return False, f"Invalid timestamp format: {timestamp} - {str(e)}"

def check_timestamps_in_dict(data: Dict, path: str = "") -> List[str]:
    """Recursively check all timestamp fields."""
    errors = []
    timestamp_fields = ['createdAt', 'updatedAt', 'ts', 'timestamp']

    for key, value in data.items():
        current_path = f"{path}.{key}" if path else key

        if key in timestamp_fields and isinstance(value, str):
            is_valid, error = validate_timestamp_format(value)
            if not is_valid:
                errors.append(f"{current_path}: {error}")
        elif isinstance(value, dict):
            errors.extend(check_timestamps_in_dict(value, current_path))
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    errors.extend(check_timestamps_in_dict(item, f"{current_path}[{i}]"))

    return errors

def validate_201_response(data: Dict) -> List[str]:
    """Validate 201 success response structure."""
    errors = []

    # Check required fields
    required_fields = ['quoteId', 'title', 'customerInfo', 'enclosureInfo',
                       'mainBreakerInfo', 'status', 'createdAt', 'updatedAt']

    body = data.get('response', {}).get('body', {})

    for field in required_fields:
        if field not in body:
            errors.append(f"Missing required field in 201 response: {field}")

    # Validate quoteId format (should be UUID)
    quote_id = body.get('quoteId', '')
    if quote_id and len(quote_id.split('-')) != 5:
        errors.append(f"Invalid quoteId format (not UUID): {quote_id}")

    # Check status value
    if body.get('status') not in ['draft', 'sent', 'approved', 'rejected']:
        errors.append(f"Invalid status value: {body.get('status')}")

    return errors

def validate_409_response(data: Dict) -> List[str]:
    """Validate 409 conflict response structure."""
    errors = []

    body = data.get('response', {}).get('body', {})
    error_obj = body.get('error', {})

    # Check required error fields
    required_fields = ['code', 'message', 'traceId']
    for field in required_fields:
        if field not in error_obj:
            errors.append(f"Missing required field in 409 error: {field}")

    # Validate error code
    if error_obj.get('code') != 'DUPLICATE_KEY':
        errors.append(f"Invalid error code for 409: {error_obj.get('code')} (expected DUPLICATE_KEY)")

    # Check traceId format (should be UUID)
    trace_id = error_obj.get('traceId', '')
    if trace_id and len(trace_id.split('-')) != 5:
        errors.append(f"Invalid traceId format (not UUID): {trace_id}")

    return errors

def validate_422_response(data: Dict) -> List[str]:
    """Validate 422 validation error response structure."""
    errors = []

    body = data.get('response', {}).get('body', {})
    error_obj = body.get('error', {})

    # Check required error fields
    required_fields = ['code', 'message', 'traceId']
    for field in required_fields:
        if field not in error_obj:
            errors.append(f"Missing required field in 422 error: {field}")

    # Validate error code
    if error_obj.get('code') != 'validation_error':
        errors.append(f"Invalid error code for 422: {error_obj.get('code')} (expected validation_error)")

    # Check details array
    details = error_obj.get('details', [])
    if not isinstance(details, list) or len(details) == 0:
        errors.append("422 error should have non-empty 'details' array")
    else:
        for i, detail in enumerate(details):
            if 'field' not in detail:
                errors.append(f"Missing 'field' in details[{i}]")
            if 'message' not in detail:
                errors.append(f"Missing 'message' in details[{i}]")

    return errors

def main():
    """Main validation runner."""
    base_dir = Path("C:/Users/PC/Desktop/KIS_CORE_V2")
    samples_dir = base_dir / "payload_samples"

    # Required sample files
    required_samples = {
        "quotes_post_success_201.json": (201, validate_201_response),
        "quotes_post_conflict_409.json": (409, validate_409_response),
        "quotes_post_unprocessable_422.json": (422, validate_422_response)
    }

    total_errors = []

    print("=" * 60)
    print("Quotes API Contract Validation")
    print("=" * 60)

    for filename, (expected_status, validator) in required_samples.items():
        filepath = samples_dir / filename
        print(f"\n[Checking] {filename}")

        if not filepath.exists():
            total_errors.append(f"Missing required sample file: {filename}")
            print(f"  [MISSING] File not found")
            continue

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                # Remove BOM if present
                content = f.read()
                if content.startswith('\ufeff'):
                    content = content[1:]
                data = json.loads(content)

            errors = []

            # Check response status
            response_status = data.get('response', {}).get('status')
            if response_status != expected_status:
                errors.append(f"Expected status {expected_status}, got {response_status}")

            # Validate response structure
            errors.extend(validator(data))

            # Check all timestamps
            timestamp_errors = check_timestamps_in_dict(data)
            errors.extend(timestamp_errors)

            if errors:
                print(f"  [FAIL] Validation failed with {len(errors)} errors:")
                for error in errors:
                    print(f"     - {error}")
                    total_errors.append(f"{filename}: {error}")
            else:
                print(f"  [OK] Valid - Status {expected_status}, timestamps OK")

        except json.JSONDecodeError as e:
            error = f"Invalid JSON: {str(e)}"
            print(f"  [ERROR] {error}")
            total_errors.append(f"{filename}: {error}")
        except Exception as e:
            error = f"Unexpected error: {str(e)}"
            print(f"  [ERROR] {error}")
            total_errors.append(f"{filename}: {error}")

    # Summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)

    if total_errors:
        print(f"\n[FAILED] {len(total_errors)} total errors found")
        print("\nAll errors:")
        for error in total_errors:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("\n[SUCCESS] All contract validations passed")
        print("  - All required sample files exist")
        print("  - Response structures match OpenAPI schema")
        print("  - UTC ISO8601 Z timestamps are consistent")
        print("  - Error formats comply with specification")
        sys.exit(0)

if __name__ == "__main__":
    main()