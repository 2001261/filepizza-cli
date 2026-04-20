#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SOURCE_DIR="$SCRIPT_DIR/filepizza-transfer"
OPENCLAW_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
SKILLS_ROOT="$OPENCLAW_HOME/skills"
SKILL_TARGET_DIR="$SKILLS_ROOT/filepizza-transfer"

mkdir -p "$SKILLS_ROOT"
rm -rf "$SKILL_TARGET_DIR"
cp -R "$SKILL_SOURCE_DIR" "$SKILL_TARGET_DIR"

echo "Installed OpenClaw skill: $SKILL_TARGET_DIR"
echo "Next:"
echo "1) Ensure openclaw.json includes agents.defaults.skills: [\"filepizza-transfer\"]"
echo "2) Ensure tools policy allows exec (or group:runtime)"
echo "3) Run: openclaw skills list"
