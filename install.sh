#!/usr/bin/env bash
# Installs incridible-skill for Claude Code (or any agent that reads ~/.claude/skills).
#   ./install.sh               v2 (recommended), user-wide: ~/.claude/skills/incridible-skill-v2
#   ./install.sh --v1          version 1 instead:            ~/.claude/skills/incridible-skill
#   ./install.sh --project     into ./.claude/skills of the current project
#   ./install.sh --uninstall   remove (combine with --v1 and/or --project)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAME="incridible-skill-v2"
SRC="$HERE/v2/skills/$NAME"
PROJECT=0
UNINSTALL=0

for arg in "$@"; do
  case "$arg" in
    --v1) NAME="incridible-skill"; SRC="$HERE/skills/$NAME" ;;
    --project) PROJECT=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -h|--help) sed -n '2,7p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [ "$PROJECT" -eq 1 ]; then
  BASE="$PWD/.claude/skills"
else
  BASE="${CLAUDE_HOME:-$HOME/.claude}/skills"
fi
DEST="$BASE/$NAME"

if [ "$UNINSTALL" -eq 1 ]; then
  if [ -d "$DEST" ]; then rm -rf "$DEST"; echo "Removed $DEST"; else echo "Nothing to remove at $DEST"; fi
  exit 0
fi

[ -f "$SRC/SKILL.md" ] || { echo "Cannot find $SRC/SKILL.md. Run this script from the repository root." >&2; exit 1; }

mkdir -p "$BASE"
[ -d "$DEST" ] && rm -rf "$DEST"
cp -R "$SRC" "$DEST"
echo "Installed $NAME to $DEST"
if [ "$NAME" = "incridible-skill-v2" ] && [ -d "$BASE/incridible-skill" ]; then
  echo "Note: version 1 is also installed at $BASE/incridible-skill. Both answer the same requests;"
  echo "      remove it with: ./install.sh --v1 --uninstall$([ "$PROJECT" -eq 1 ] && echo ' --project')"
fi
echo "Start a new agent session (or run /reload-plugins in Claude Code) to load it."
