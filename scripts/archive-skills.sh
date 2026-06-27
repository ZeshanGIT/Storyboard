#!/usr/bin/env bash
# Move skills from .agents/skills/ (auto-discovered) to .agents/skill-archive/
# (manual @ attach only). Run after installing new skills into the default folder.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/.agents/skills"
DEST="$ROOT/.agents/skill-archive"

mkdir -p "$DEST"

if [[ ! -d "$SRC" ]]; then
  echo "No .agents/skills/ — nothing to archive."
  exit 0
fi

shopt -s nullglob
entries=("$SRC"/*)
shopt -u nullglob

if [[ ${#entries[@]} -eq 0 ]]; then
  echo "No skills in .agents/skills/ — nothing to archive."
  exit 0
fi

moved=0
skipped=0

for path in "${entries[@]}"; do
  [[ -d "$path" ]] || continue

  name="$(basename "$path")"
  target="$DEST/$name"

  if [[ -e "$target" ]]; then
    echo "skip: $name (already in skill-archive)"
    skipped=$((skipped + 1))
    continue
  fi

  mv "$path" "$target"
  echo "archived: $name"
  moved=$((moved + 1))
done

if [[ $moved -eq 0 && $skipped -eq 0 ]]; then
  echo "No skill directories found in .agents/skills/."
elif [[ $moved -eq 0 ]]; then
  echo "Done. $skipped skipped (already archived)."
else
  echo "Done. $moved archived. Attach via @.agents/skill-archive/<name>/SKILL.md"
fi
