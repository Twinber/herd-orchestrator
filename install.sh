#!/usr/bin/env bash
# Installer for herd-orchestrator: registers the MCP server + commands in the
# user's opencode config without breaking existing settings.
#
# Usage:
#   ./install.sh                # install globally (~/.config/opencode)
#   ./install.sh --project      # install into the current project's .opencode/
#   ./install.sh --dry-run      # show what would change without writing
#   ./install.sh --no-test      # skip npm install + smoke test
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORIG_CWD="$(pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "[install][error] Node.js is required (v18+)." >&2
  exit 1
fi

echo "[install] herd-orchestrator installer"
echo "[install] node: $(node --version)"

cd "$SCRIPT_DIR"
OPENCODE_PROJECT_CWD="$ORIG_CWD" exec node scripts/install.mjs "$@"
