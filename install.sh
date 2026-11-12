#!/usr/bin/env bash
# Installs incridible-skill for Claude Code (or any agent that reads ~/.claude/skills).
#   ./install.sh               user-wide:    ~/.claude/skills/incridible-skill
#   ./install.sh --project     this project: ./.claude/skills/incridible-skill
#   ./install.sh --uninstall   remove (add --project for the project copy)
# Running it again updates an existing install to the version in this folder.
set -euo pipefail

NAME="incridible-skill"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/skills/$NAME"
PROJECT=0
UNINSTALL=0

for arg in "$@"; do
  case "$arg" in
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
if [ -d "$BASE/incridible-skill-v2" ]; then
  echo "Note: an older separate copy named incridible-skill-v2 exists in $BASE. It duplicates this skill; delete that folder."
fi
echo "Start a new agent session (or run /reload-plugins in Claude Code) to load it."
