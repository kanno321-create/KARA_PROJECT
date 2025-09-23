#!/usr/bin/env python3
"""
KIS v2.0 Production Unlock Verification Tool
Validates all requirements before allowing production deployment
"""

import json
import os
import sys
import glob
import hashlib
import re
from pathlib import Path

def load_policy():
    """Load unlock policy from JSON"""
    policy_path = Path(__file__).parent.parent / "docs/unlock/UNLOCK_POLICY.json"
    if not policy_path.exists():
        print(f"❌ Policy file not found: {policy_path}")
        sys.exit(1)

    with open(policy_path) as f:
        return json.load(f)

def verify_ceo_signature(policy):
    """Verify CEO signature exists and is valid"""
    sig_file = Path(__file__).parent.parent / policy["requirements"]["signatures"]["ceo_signature_file"]
    if not sig_file.exists():
        print(f"❌ CEO signature file not found: {sig_file}")
        return False

    with open(sig_file) as f:
        signature = json.load(f)

    required_fields = policy["requirements"]["signatures"]["required_fields"]
    for field in required_fields:
        if field not in signature or not signature[field]:
            print(f"❌ Missing signature field: {field}")
            return False

    # Verify policy hash matches
    policy_hash = hashlib.sha256(json.dumps(policy, sort_keys=True).encode()).hexdigest()[:8]
    if signature.get("policy_hash") != policy_hash:
        print(f"❌ Policy hash mismatch: {signature.get('policy_hash')} != {policy_hash}")
        return False

    print(f"✅ CEO signature valid: {signature['name']} on {signature['date']}")
    return True

def verify_regression_tests(policy):
    """Verify regression test success rate"""
    pattern = policy["requirements"]["regression"]["evidence_pattern"]
    files = glob.glob(str(Path(__file__).parent.parent / pattern))

    if not files:
        print(f"❌ No regression test results found: {pattern}")
        return False

    # Get latest file
    latest_file = max(files, key=os.path.getctime)
    with open(latest_file) as f:
        results = json.load(f)

    success_rate = results.get("success_rate", 0)
    min_rate = policy["requirements"]["regression"]["min_success_rate"]

    if success_rate < min_rate:
        print(f"❌ Regression test rate {success_rate:.1%} < {min_rate:.1%}")
        return False

    print(f"✅ Regression tests pass: {success_rate:.1%}")
    return True

def verify_fix4_metrics(policy):
    """Verify FIX-4 engine metrics"""
    metrics = policy["requirements"]["fix4_metrics"]

    # Look for latest FIX-4 log
    log_pattern = Path(__file__).parent.parent / "Work/*/fix4_metrics.json"
    files = glob.glob(str(log_pattern))

    if not files:
        print(f"❌ No FIX-4 metrics found: {log_pattern}")
        return False

    latest_file = max(files, key=os.path.getctime)
    with open(latest_file) as f:
        fix4_data = json.load(f)

    all_pass = True
    for metric, requirement in metrics.items():
        value = fix4_data.get(metric, float('inf'))

        if "min" in requirement and value < requirement["min"]:
            print(f"❌ {metric}: {value} < {requirement['min']}")
            all_pass = False
        elif "max" in requirement and value > requirement["max"]:
            print(f"❌ {metric}: {value} > {requirement['max']}")
            all_pass = False
        elif "equals" in requirement and value != requirement["equals"]:
            print(f"❌ {metric}: {value} != {requirement['equals']}")
            all_pass = False
        else:
            print(f"✅ {metric}: {value}")

    return all_pass

def verify_evidence_files(policy):
    """Verify all evidence files exist"""
    evidence_paths = policy["requirements"]["evidence_paths"]
    all_exist = True

    for evidence_type, pattern in evidence_paths.items():
        files = glob.glob(str(Path(__file__).parent.parent / pattern))
        if not files:
            print(f"❌ Missing evidence: {evidence_type} ({pattern})")
            all_exist = False
        else:
            print(f"✅ Evidence found: {evidence_type} ({len(files)} files)")

    return all_exist

def verify_templates_hash(policy):
    """Verify templates are hashed and frozen"""
    hash_pattern = policy["requirements"]["templates"]["hash_file_pattern"]
    files = glob.glob(str(Path(__file__).parent.parent / hash_pattern))

    if not files:
        print(f"❌ No template hash file found: {hash_pattern}")
        return False

    latest_hash = max(files, key=os.path.getctime)
    print(f"✅ Template hash file: {Path(latest_hash).name}")

    # Verify required template files exist
    for template in policy["requirements"]["templates"]["required_files"]:
        template_path = Path(__file__).parent.parent / template
        if not template_path.exists():
            print(f"❌ Missing template: {template}")
            return False

    return True

def main():
    """Main verification flow"""
    print("=" * 60)
    print("KIS v2.0 Production Unlock Verification")
    print("=" * 60)

    # Check foundation-only mode
    if os.getenv("FEATURE_PROD_ENABLED") != "1":
        print("⚠️  FEATURE_PROD_ENABLED != 1 (foundation-only mode)")

    policy = load_policy()
    results = []

    # Run all verifications
    print("\n1. CEO Signature Verification")
    results.append(verify_ceo_signature(policy))

    print("\n2. Regression Test Verification")
    results.append(verify_regression_tests(policy))

    print("\n3. FIX-4 Metrics Verification")
    results.append(verify_fix4_metrics(policy))

    print("\n4. Evidence Files Verification")
    results.append(verify_evidence_files(policy))

    print("\n5. Templates Hash Verification")
    results.append(verify_templates_hash(policy))

    # Summary
    print("\n" + "=" * 60)
    if all(results):
        print("✅ ALL CHECKS PASSED - Ready for production unlock")
        sys.exit(0)
    else:
        failed = sum(1 for r in results if not r)
        print(f"❌ {failed} CHECK(S) FAILED - Cannot unlock production")
        sys.exit(1)

if __name__ == "__main__":
    main()