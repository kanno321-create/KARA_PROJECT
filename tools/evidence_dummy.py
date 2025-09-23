#!/usr/bin/env python3
"""
Evidence file generator for testing
Creates dummy SVG and JSON evidence files
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def create_svg(basename):
    """Create a dummy SVG file"""
    svg_content = f"""<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="600" fill="#f0f0f0"/>
    <text x="400" y="300" text-anchor="middle" font-size="24" fill="#333">
        {basename} Evidence Placeholder
    </text>
    <text x="400" y="340" text-anchor="middle" font-size="14" fill="#666">
        Generated: {datetime.now().isoformat()}
    </text>
</svg>"""

    svg_path = Path(f"{basename}.svg")
    svg_path.write_text(svg_content)
    print(f"Created: {svg_path}")
    return svg_path

def create_json(basename):
    """Create a dummy JSON evidence file"""
    evidence = {
        "type": basename,
        "timestamp": datetime.now().isoformat(),
        "status": "PASS",
        "metrics": {
            "fit_score": 0.95,
            "phase_imbalance_pct": 2.5,
            "clearances": 0,
            "thermal_issues": 0,
            "lint_errors": 0
        },
        "details": {
            "description": f"Evidence for {basename}",
            "generated_by": "evidence_dummy.py",
            "version": "2.0"
        }
    }

    json_path = Path(f"{basename}_evidence.json")
    json_path.write_text(json.dumps(evidence, indent=2))
    print(f"Created: {json_path}")
    return json_path

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python evidence_dummy.py <basename>")
        print("Example: python evidence_dummy.py enclosure")
        sys.exit(1)

    basename = sys.argv[1]
    print(f"Generating evidence files for: {basename}")

    svg_file = create_svg(basename)
    json_file = create_json(basename)

    print(f"\n✅ Generated:")
    print(f"  - {svg_file}")
    print(f"  - {json_file}")

if __name__ == "__main__":
    main()