#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${FILEPIZZA_INSTALL_DIR:-$HOME/.filepizza-cli}"
BIN_DIR="${FILEPIZZA_BIN_DIR:-$HOME/.local/bin}"

rm -rf "$INSTALL_DIR"
rm -f "$BIN_DIR/fp"

echo "Removed FilePizza CLI runtime."
echo "  Runtime removed: $INSTALL_DIR"
echo "  Launcher removed: $BIN_DIR/fp"
