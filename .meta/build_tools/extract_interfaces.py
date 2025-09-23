import ast, json, re
from pathlib import Path

proj=Path(r"C:\Users\PC\Desktop\KIS_CORE_V2")
eng=proj/"engine"
outj=proj/".meta"/"interface_map.json"
outm=proj/".meta"/"interface_map.md"

class SigVisitor(ast.NodeVisitor):
    def __init__(self):
        self.functions = []
        self.classes = []
        self.imports = []
        self.cli_args = set()
        self.outputs = set()

    def visit_FunctionDef(self, node):
        args = []
        defaults = node.args.defaults
        default_offset = len(node.args.args) - len(defaults)
        for idx, arg in enumerate(node.args.args):
            default = None
            if idx - default_offset >= 0:
                d = defaults[idx - default_offset]
                try:
                    default = ast.unparse(d)
                except Exception:
                    default = None
            args.append({"name": arg.arg, "default": default})
        self.functions.append({"name": node.name, "args": args})
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        bases = []
        for base in node.bases:
            try:
                bases.append(ast.unparse(base))
            except Exception:
                bases.append(getattr(base, "id", None))
        self.classes.append({"name": node.name, "bases": bases})
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)

    def visit_ImportFrom(self, node):
        self.imports.append(node.module or "")


def parse_file(path: Path):
    data = {"file": str(path.relative_to(proj)), "functions": [], "classes": [], "cli_args": [], "imports": [], "outputs": []}
    try:
        source = path.read_text(encoding="utf-8", errors="ignore")
        tree = ast.parse(source)
        visitor = SigVisitor()
        visitor.visit(tree)
        data["functions"] = visitor.functions
        data["classes"] = visitor.classes
        data["imports"] = visitor.imports
        if "__main__" in source and "argparse" in source:
            flags = re.findall(r'add_argument\(\s*"(--[\w-]+)"', source)
            data["cli_args"] = sorted(set(flags))
        output_patterns = [r"\.json\"", r"\.svg\"", r"_evidence\.json", r"with_suffix\("]
        hits = set()
        for pat in output_patterns:
            if re.search(pat, source):
                hits.add(pat)
        data["outputs"] = sorted(hits)
    except Exception as exc:
        data["error"] = str(exc)
    return data

results = []
if eng.exists():
    for file in sorted(eng.glob("*.py")):
        results.append(parse_file(file))

outj.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

lines = ["# Interface Map"]
for entry in results:
    lines.append(f"## {entry['file']}")
    if entry.get("error"):
        lines.append(f"- PARSE ERROR: {entry['error']}")
    func_desc = ", ".join(
        f"{f['name']}(" + ", ".join(
            [f"{a['name']}={a['default']}" if a['default'] else a['name'] for a in f['args']]
        ) + ")"
        for f in entry.get("functions", [])
    ) or "(none)"
    class_desc = ", ".join(
        f"{c['name']}" + (f"[{', '.join([b for b in c['bases'] if b])}]" if any(c['bases']) else "")
        for c in entry.get("classes", [])
    ) or "(none)"
    lines.append("- Functions: " + func_desc)
    lines.append("- Classes: " + class_desc)
    lines.append("- CLI Args: " + (", ".join(entry.get("cli_args", [])) or "(none)"))
    lines.append("- Imports: " + (", ".join(sorted(set(entry.get("imports", [])))) or "(none)"))
    lines.append("- Output hints: " + (", ".join(entry.get("outputs", [])) or "(none)"))

outm.write_text("\n".join(lines), encoding="utf-8")
print(outj)
print(outm)
