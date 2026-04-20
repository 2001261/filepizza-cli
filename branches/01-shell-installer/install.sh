#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

INSTALL_DIR="${FILEPIZZA_INSTALL_DIR:-$HOME/.filepizza-cli}"
BIN_DIR="${FILEPIZZA_BIN_DIR:-$HOME/.local/bin}"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required but was not found." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but was not found." >&2
  exit 1
fi

PLAYWRIGHT_VERSION="$(
  REPO_ROOT="$REPO_ROOT" node -e 'const pkg = require(process.env.REPO_ROOT + "/package.json");
const version = (pkg.devDependencies && pkg.devDependencies.playwright) || (pkg.dependencies && pkg.dependencies.playwright);
if (!version) throw new Error("playwright version not found in package.json");
process.stdout.write(version);'
)"

mkdir -p "$INSTALL_DIR/bin" "$INSTALL_DIR/src/cli" "$BIN_DIR"

cp "$REPO_ROOT/bin/fp.js" "$INSTALL_DIR/bin/fp.js"
cp "$REPO_ROOT/src/cli/"*.js "$INSTALL_DIR/src/cli/"

cat >"$INSTALL_DIR/package.json" <<EOF
{
  "name": "filepizza-cli-runtime",
  "private": true,
  "version": "1.0.0",
  "license": "UNLICENSED",
  "description": "Runtime package for FilePizza CLI",
  "dependencies": {
    "playwright": "$PLAYWRIGHT_VERSION"
  }
}
EOF

pushd "$INSTALL_DIR" >/dev/null
npm install --omit=dev
popd >/dev/null

cat >"$BIN_DIR/fp" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec node "$INSTALL_DIR/bin/fp.js" "\$@"
EOF

chmod +x "$BIN_DIR/fp"
"$BIN_DIR/fp" --help >/dev/null

echo "Installed FilePizza CLI runtime."
echo "  Runtime: $INSTALL_DIR"
echo "  Launcher: $BIN_DIR/fp"

if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  echo ""
  echo "PATH update required. Add this to your shell profile:"
  echo "  export PATH=\"$BIN_DIR:\$PATH\""
fi
