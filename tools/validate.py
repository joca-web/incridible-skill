#!/usr/bin/env python3
"""Repository checks for incridible-skill. Runs locally and in CI. Standard library only.

  python3 tools/validate.py

Checks: SKILL.md frontmatter, name matches the folder, size limit, every path mentioned in
SKILL.md exists, manifests are valid JSON with matching names, scripts compile.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "incridible-skill"
errors = []


def fail(msg):
    errors.append(msg)
    print("FAIL", msg)


def ok(msg):
    print("ok  ", msg)


# 1. SKILL.md frontmatter
text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
if not m:
    fail("SKILL.md has no YAML frontmatter")
else:
    fm = m.group(1)
    name = re.search(r"^name:\s*(.+)$", fm, re.M)
    desc = re.search(r"^description:\s*(.+)$", fm, re.M)
    if not name or name.group(1).strip() != SKILL.name:
        fail(f"frontmatter name must equal folder name '{SKILL.name}'")
    else:
        ok(f"name = {SKILL.name}")
    if not desc or len(desc.group(1)) < 80:
        fail("frontmatter description missing or too short")
    elif len(desc.group(1)) > 1024:
        fail(f"description is {len(desc.group(1))} chars, limit is 1024")
    else:
        ok(f"description length {len(desc.group(1))}")

# 2. size
lines = text.count("\n") + 1
(ok if lines <= 500 else fail)(f"SKILL.md has {lines} lines (limit 500)")

# 3. referenced paths exist
missing = []
for rel in sorted(set(re.findall(r"`((?:references|assets|scripts)/[A-Za-z0-9_./-]+)`", text))):
    if not (SKILL / rel.rstrip("/")).exists():
        missing.append(rel)
(fail if missing else ok)("paths referenced in SKILL.md exist" if not missing else f"missing paths: {missing}")

# 4. manifests
plugin = ROOT / ".claude-plugin" / "plugin.json"
market = ROOT / ".claude-plugin" / "marketplace.json"
try:
    p = json.loads(plugin.read_text())
    mk = json.loads(market.read_text())
    entry_names = [e["name"] for e in mk["plugins"]]
    if p["name"] not in entry_names:
        fail("plugin.json name must match a marketplace.json plugin entry name")
    elif p["name"] != SKILL.name:
        fail("plugin name should equal the skill folder name")
    else:
        ok("plugin.json and marketplace.json agree")
    if not mk.get("owner", {}).get("name"):
        fail("marketplace.json needs owner.name")
except Exception as e:  # noqa: BLE001
    fail(f"manifest error: {e}")

# 5. scripts compile
for py in SKILL.glob("scripts/*.py"):
    try:
        compile(py.read_text(encoding="utf-8"), str(py), "exec")
        ok(f"{py.name} compiles")
    except SyntaxError as e:
        fail(f"{py.name}: {e}")
for js in [*SKILL.glob("scripts/*.mjs"), SKILL / "assets" / "starter" / "main.js", SKILL / "assets" / "webgl" / "depth-hero.js"]:
    try:
        r = subprocess.run(["node", "--check", str(js)], capture_output=True, text=True)
        (ok if r.returncode == 0 else fail)(f"{js.name} syntax" + ("" if r.returncode == 0 else f": {r.stderr.strip()[:200]}"))
    except FileNotFoundError:
        print("skip node not installed:", js.name)

# 6. packaged skill present
(ok if (ROOT / "dist" / "incridible-skill.skill").exists() else fail)("dist/incridible-skill.skill present")

print()
if errors:
    print(f"{len(errors)} problem(s)")
    sys.exit(1)
print("all checks passed")
