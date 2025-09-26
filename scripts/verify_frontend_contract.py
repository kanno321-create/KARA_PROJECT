from __future__ import annotations

import re
from pathlib import Path

import yaml

FRONTEND_HTML = Path("frontend-kis-complete.html")
OPENAPI_PATH = Path("spec/openapi.yaml")


def extract_expected_paths() -> set[str]:
    html = FRONTEND_HTML.read_text(encoding="utf-8")
    ## naive extraction of paths referenced in requirements doc words
    buttons = re.findall(r"/v1/[a-zA-Z0-9_/-]+", html)
    return set(buttons)


def load_openapi_paths() -> set[str]:
    doc = yaml.safe_load(OPENAPI_PATH.read_text(encoding="utf-8"))
    return set(doc.get("paths", {}).keys())


def main() -> None:
    html_paths = extract_expected_paths()
    api_paths = load_openapi_paths()
    missing = sorted(p for p in html_paths if p not in api_paths)
    print(f"OpenAPI defines {len(api_paths)} endpoints")
    if missing:
        print("WARNING: missing paths from frontend hints:")
        for path in missing:
            print(f" - {path}")
    else:
        print("Frontend references are covered by the OpenAPI spec")


if __name__ == "__main__":
    main()