#!/usr/bin/env python3
import sys, pathlib

def to_text(data: bytes) -> str:
    # decode with fallbacks
    for enc in ("utf-8", "utf-8-sig", "cp949", "latin-1"):
        try:
            return data.decode(enc)
        except Exception:
            continue
    # last resort
    return data.decode("utf-8", errors="replace")

def normalize_text(s: str) -> str:
    # normalize unicode punctuation/spaces
    replacements = {
        "\u2018": "'", "\u2019": "'",
        "\u201C": '"', "\u201D": '"',
        "\u00A0": " ",  # NBSP
        "\uFEFF": "",   # BOM if present inside
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    # normalize newlines to LF
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    return s

def main(paths):
    changed = 0
    for p in paths:
        path = pathlib.Path(p)
        if not path.is_file():
            continue
        raw = path.read_bytes()
        before = raw
        text = to_text(raw)
        norm = normalize_text(text)
        out = norm.encode("utf-8")
        if out != before:
            path.write_bytes(out)
            changed += 1
    print(f"normalized_files={changed}")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))