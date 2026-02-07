#!/bin/bash
set -euo pipefail

# Only run on remote (Claude Code on the web)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/user/AIMS}"

# Install frontend dependencies
cd "$PROJECT_DIR/frontend"
npm install

# Install backend dependencies
cd "$PROJECT_DIR/backend/uef-gateway"
npm install
