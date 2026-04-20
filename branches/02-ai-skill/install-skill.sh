#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SOURCE_DIR="$SCRIPT_DIR/filepizza-transfer"
SKILLS_ROOT="${CODEX_HOME:-$HOME/.codex}/skills"
SKILL_TARGET_DIR="$SKILLS_ROOT/filepizza-transfer"

mkdir -p "$SKILLS_ROOT"
rm -rf "$SKILL_TARGET_DIR"
cp -R "$SKILL_SOURCE_DIR" "$SKILL_TARGET_DIR"

echo "Installed skill: $SKILL_TARGET_DIR"
echo "Restart Codex session if the skill list does not refresh automatically."
