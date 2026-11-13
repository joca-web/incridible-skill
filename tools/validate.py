#!/usr/bin/env python3
"""Repository checks for awwwards-skill (current skill and the archived versions). Runs locally and in CI. Standard library only.

  python3 tools/validate.py

Per skill: frontmatter, name equals folder, description limit, SKILL.md size, every path mentioned in
SKILL.md exists, scripts and modules compile. Repository: marketplace entries point at plugin folders
whose plugin.json names match, and each listed plugin ships its skill; packaged skills exist.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = [ROOT / "skills" / "awwwards-skill", ROOT / "versions" / "v1" / "incridible-skill", ROOT / "versions" / "v2" / "incridible-skill"]
errors = []


def fail(msg):
    errors.append(msg)
    print("FAIL", msg)


def ok(msg):
    print("ok  ", msg)


def node_check(path, module=False):
    try:
        if module:
            r = subprocess.run(["node", "--check", "--input-type=module"], input=path.read_text(encoding="utf-8"), capture_output=True, text=True)
        else:
            r = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
    except FileNotFoundError:
        print("skip node not installed:", path.name)
        return
    (ok if r.returncode == 0 else fail)(f"{path.relative_to(ROOT)} syntax" + ("" if r.returncode == 0 else f": {r.stderr.strip()[:200]}"))


for skill in SKILLS:
    print(f"\n== {skill.relative_to(ROOT)}")
    md = skill / "SKILL.md"
    if not md.exists():
        fail(f"{md} missing")
        continue
    text = md.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        fail("SKILL.md has no YAML frontmatter")
        continue
    fm = m.group(1)
    try:
        import yaml  # PyYAML; an unquoted ": " in the description breaks real loaders
        try:
            yaml.safe_load(fm)
            ok("frontmatter parses as YAML")
        except yaml.YAMLError as e:
            fail(f"frontmatter is not valid YAML: {str(e).splitlines()[0]}")
    except ImportError:
        print("note PyYAML not installed; strict frontmatter parse skipped (pip install pyyaml)")
    name = re.search(r"^name:\s*(.+)$", fm, re.M)
    desc = re.search(r"^description:\s*(.+)$", fm, re.M)
    (ok if name and name.group(1).strip() == skill.name else fail)(f"frontmatter name equals folder '{skill.name}'")
    d = desc.group(1) if desc else ""
    (ok if 80 <= len(d) <= 1024 else fail)(f"description length {len(d)} (80..1024)")
    lines = text.count("\n") + 1
    (ok if lines <= 500 else fail)(f"SKILL.md has {lines} lines (limit 500)")
    missing = [rel for rel in sorted(set(re.findall(r"`((?:references|assets|scripts)/[A-Za-z0-9_./-]+)`", text)))
               if not (skill / rel.rstrip("/")).exists()]
    (fail if missing else ok)(f"missing paths: {missing}" if missing else "paths referenced in SKILL.md exist")
    for py in sorted(skill.glob("scripts/*.py")):
        try:
            compile(py.read_text(encoding="utf-8"), str(py), "exec")
            ok(f"{py.relative_to(ROOT)} compiles")
        except SyntaxError as e:
            fail(f"{py.name}: {e}")
    for js in sorted(skill.glob("scripts/*.mjs")):
        node_check(js)
    for js in sorted((skill / "assets").rglob("*.js")):
        is_module = "components" in js.parts or "three" in js.parts or "models" in js.parts or js.name in ("site.js", "depth-hero.js")
        node_check(js, module=is_module)

print("\n== manifests")
try:
    mk = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text())
    (ok if mk.get("owner", {}).get("name") else fail)("marketplace owner.name")
    for entry in mk["plugins"]:
        src = (ROOT / entry["source"]).resolve()
        pj = src / ".claude-plugin" / "plugin.json"
        p = json.loads(pj.read_text())
        (ok if p["name"] == entry["name"] else fail)(f"{entry['name']}: plugin.json name matches marketplace entry")
        shipped = [s.name for s in (src / "skills").iterdir() if (s / "SKILL.md").exists()] if (src / "skills").exists() else []
        (ok if shipped == [entry["name"]] else fail)(f"{entry['name']}: plugin ships exactly its own skill ({shipped})")
except Exception as e:  # noqa: BLE001
    fail(f"manifest error: {e}")

print("\n== packages")
for f in ("dist/awwwards-skill.skill", "dist/awwwards-skill.plugin", "versions/v1/incridible-skill-v1.skill", "versions/v2/incridible-skill-v2.skill"):
    (ok if (ROOT / f).exists() else fail)(f"{f} present")

print()
if errors:
    print(f"{len(errors)} problem(s)")
    sys.exit(1)
print("all checks passed")
