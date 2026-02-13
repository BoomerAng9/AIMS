#!/usr/bin/env bash
# =============================================================================
# Setup Intelligent Internet vendor repos for Chicken Hawk
# These repos provide core capabilities:
#   - CommonGround: Multi-agent team collaboration
#   - ii-researcher: Deep search/research agents
#   - Common_Chronicle: Structured audit timelines
#   - litellm-debugger: LLM gateway proxy (100+ APIs)
#   - codex-as-mcp: Coding agent as MCP server
# =============================================================================

set -euo pipefail

VENDOR_DIR="$(cd "$(dirname "$0")/.." && pwd)/vendor/intelligent-internet"
mkdir -p "$VENDOR_DIR"

repos=(
  "CommonGround"
  "ii-researcher"
  "Common_Chronicle"
  "litellm-debugger"
  "codex-as-mcp"
)

echo "=== Setting up Intelligent Internet vendor repos ==="

for repo in "${repos[@]}"; do
  target="$VENDOR_DIR/$repo"
  if [ -d "$target/.git" ]; then
    echo "[OK] $repo already cloned"
  else
    echo "[CLONE] $repo..."
    git clone --depth 1 "https://github.com/Intelligent-Internet/${repo}.git" "$target"
  fi
done

echo "=== All vendor repos ready ==="
