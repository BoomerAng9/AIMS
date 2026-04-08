#!/usr/bin/env bash
# =============================================================================
# Stitch — A.I.M.S. Design System via Gemini CLI
# =============================================================================
# Usage:
#   ./stitch.sh "Create a dashboard card for athlete scouting grades"
#   ./stitch.sh --spec "ConversationShell layout for mobile"
#   ./stitch.sh --file src/components/Card.tsx "Refactor to match Circuit Box tokens"
#
# Prerequisites:
#   - Gemini CLI installed and in PATH
#   - GEMINI_API_KEY set in environment
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PERSONA_PATH="${SCRIPT_DIR}/.stitch/persona.md"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
if [[ ! -f "$PERSONA_PATH" ]]; then
  echo -e "${RED}Error: Stitch persona not found at ${PERSONA_PATH}${NC}" >&2
  exit 1
fi

if ! command -v gemini &>/dev/null; then
  echo -e "${RED}Error: Gemini CLI not found. Install it first.${NC}" >&2
  exit 1
fi

# Parse arguments
MODE="prompt"
FILE_CONTEXT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --spec)
      MODE="spec"
      shift
      ;;
    --file)
      FILE_CONTEXT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: stitch.sh [--spec] [--file <path>] <prompt>"
      echo ""
      echo "Options:"
      echo "  --spec       Output full design spec (layout + components + motion + QA)"
      echo "  --file PATH  Include file content as context"
      echo "  --help       Show this help"
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

USER_PROMPT="$*"

if [[ -z "$USER_PROMPT" ]]; then
  echo -e "${RED}Error: No prompt provided.${NC}" >&2
  echo "Usage: stitch.sh <prompt>" >&2
  exit 1
fi

# Load persona
PERSONA=$(cat "$PERSONA_PATH")

# Build combined prompt
COMBINED="SYSTEM_INSTRUCTION:
${PERSONA}

"

# Add file context if provided
if [[ -n "$FILE_CONTEXT" && -f "$FILE_CONTEXT" ]]; then
  FILE_CONTENT=$(cat "$FILE_CONTEXT")
  COMBINED+="FILE_CONTEXT (${FILE_CONTEXT}):
${FILE_CONTENT}

"
fi

# Add mode-specific instructions
if [[ "$MODE" == "spec" ]]; then
  COMBINED+="OUTPUT_MODE: Full design spec. Include: Layout Map, Component Tree, Tailwind Classes, State Map, Motion Spec, QA Checklist.

"
fi

COMBINED+="USER_COMMAND:
${USER_PROMPT}"

echo -e "${CYAN}Stitch: Weaving with Gemini...${NC}"

# Invoke Gemini CLI
gemini "$COMBINED"

echo -e "${GREEN}Stitch: Done.${NC}"
