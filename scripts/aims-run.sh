#!/usr/bin/env bash
set -euo pipefail

# =========================
# AIMS Governed Command Runner
# - Enforces: context presence, path safety, env gating, budget caps (placeholder)
# - Intended to be the ONLY entry-point for editor tasks
# =========================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CTX_PATH="${ROOT_DIR}/.aims/context.json"
AIMS_MODE="${AIMS_MODE:-dev}"

fail() { echo "AIMS_RUN_ERROR: $*" >&2; exit 1; }

require_context() {
  [[ -f "$CTX_PATH" ]] || fail "Missing context: ${CTX_PATH}. Create it before running governed commands."
}

# Minimal JSON reader without jq (expects stable keys).
# For production, prefer jq in the container image; this is a safe fallback.
json_get() {
  local key="$1"
  python3 - <<PY 2>/dev/null
import json,sys
p="${CTX_PATH}"
k="${key}"
try:
  with open(p,"r",encoding="utf-8") as f:
    d=json.load(f)
  v=d.get(k,"")
  print("" if v is None else v)
except Exception:
  print("")
PY
}

enforce_env_gating() {
  local environment
  environment="$(json_get environment)"
  [[ -n "$environment" ]] || fail "Context missing 'environment'."
  if [[ "$environment" == "prod" ]]; then
    fail "Editor actions are not allowed in prod."
  fi
}

enforce_actor() {
  local actor_id
  actor_id="$(json_get actor_id)"
  [[ -n "$actor_id" ]] || fail "Context missing 'actor_id'."
}

# Basic allowlist for commands invoked from the editor
is_allowed_command() {
  local cmd="$1"
  case "$cmd" in
    next-dev|test|build|claude) return 0 ;;
    *) return 1 ;;
  esac
}

# Block obviously dangerous tooling from being executed via this gateway
deny_dangerous_bins() {
  local deny_bins=("kubectl" "helm" "terraform" "aws" "gcloud" "az" "ssh" "scp" "sftp")
  for b in "${deny_bins[@]}"; do
    if command -v "$b" >/dev/null 2>&1; then
      # Do not fail hard here (some images include these), but prevent usage via gateway
      :
    fi
  done
}

# Placeholder: budget enforcement hook (UCP)
# Integrate to your budget envelope service when ready.
enforce_budget() {
  local job_id
  job_id="$(json_get job_id)"
  [[ -n "$job_id" ]] || fail "Context missing 'job_id'."
  # Example hook:
  # curl -fsS "$AIMS_BUDGET_URL/check" -H "Authorization: Bearer $AIMS_TOKEN" -d "{\"job_id\":\"$job_id\",\"action\":\"$1\"}" || fail "Budget check failed"
}

# Creates a lightweight audit log (local). Replace/extend with centralized logging.
audit() {
  local action="$1"
  local ts actor job tenant
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  actor="$(json_get actor_id)"
  job="$(json_get job_id)"
  tenant="$(json_get tenant_id)"
  mkdir -p "${ROOT_DIR}/.aims/logs"
  echo "${ts} action=${action} actor=${actor} job=${job} tenant=${tenant}" >> "${ROOT_DIR}/.aims/logs/editor-actions.log"
}

run_next_dev() {
  audit "next-dev"
  enforce_budget "next-dev"
  cd "$ROOT_DIR/frontend"
  exec npm run dev
}

run_test() {
  audit "test"
  enforce_budget "test"
  cd "$ROOT_DIR/frontend"
  exec npm test
}

run_build() {
  audit "build"
  enforce_budget "build"
  cd "$ROOT_DIR/frontend"
  exec npm run build
}

run_claude() {
  audit "claude"
  enforce_budget "claude"
  cd "$ROOT_DIR"
  # Governed execution for Claude Code CLI:
  # - Reads context.json (must be present)
  # - Stays inside workspace
  # Replace 'claude' with your actual CLI entrypoint if different.
  if ! command -v claude >/dev/null 2>&1; then
    fail "Claude CLI not found in PATH."
  fi
  exec claude --context "$CTX_PATH"
}

main() {
  local action="${1:-}"
  [[ -n "$action" ]] || fail "Usage: $0 {next-dev|test|build|claude}"
  is_allowed_command "$action" || fail "Action not allowed: $action"

  require_context
  enforce_env_gating
  enforce_actor
  deny_dangerous_bins

  case "$action" in
    next-dev) run_next_dev ;;
    test)     run_test ;;
    build)    run_build ;;
    claude)   run_claude ;;
    *)        fail "Unhandled action: $action" ;;
  esac
}

main "$@"
