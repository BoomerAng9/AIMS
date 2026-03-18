#!/usr/bin/env bash
set -euo pipefail

PATH_ARG="infra/.env.production"
TEMPLATE_MODE=false
STRICT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--path)
      PATH_ARG="$2"
      shift 2
      ;;
    --template-mode)
      TEMPLATE_MODE=true
      shift
      ;;
    --strict)
      STRICT=true
      shift
      ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/validate-env.sh [options]

Options:
  -p, --path <file>     Path to env file (default: infra/.env.production)
  --template-mode       Allow placeholder values in required keys (warn only)
  --strict              Enforce extra checks (e.g., II_AGENT_BRIDGE_KEY)
EOF
      exit 0
      ;;
    *)
      echo "[FAIL] Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$PATH_ARG" ]]; then
  echo "[FAIL] Env file not found: $PATH_ARG" >&2
  exit 1
fi

declare -A VALUES=()
ISSUES=()
WARNINGS=()
DUPLICATES=()

line_no=0
while IFS= read -r line; do
  line_no=$((line_no + 1))

  [[ -z "${line//[[:space:]]/}" ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue

  if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    value="${value#${value%%[![:space:]]*}}"
    value="${value%${value##*[![:space:]]}}"

    if [[ -n "${VALUES[$key]+x}" ]]; then
      DUPLICATES+=("$key (line $line_no)")
    fi

    VALUES[$key]="$value"
  fi
done < "$PATH_ARG"

REQUIRED_KEYS=(
  NEXTAUTH_SECRET
  INTERNAL_API_KEY
  POSTGRES_PASSWORD
  REDIS_PASSWORD
  OPENROUTER_API_KEY
  ANTHROPIC_API_KEY
  CHAT_RUNTIME_BRIDGE_SECRET
)

is_placeholder() {
  local v="$1"
  [[ -z "$v" ]] && return 0
  [[ "$v" == *change-this* ]] && return 0
  [[ "$v" == *generate-a-random* ]] && return 0
  [[ "$v" == *yourdomain.com* ]] && return 0
  [[ "$v" == "your@email.com" ]] && return 0
  return 1
}

if [[ ${#DUPLICATES[@]} -gt 0 ]]; then
  ISSUES+=("Duplicate variable declarations detected: ${DUPLICATES[*]}")
fi

for key in "${REQUIRED_KEYS[@]}"; do
  if [[ -z "${VALUES[$key]+x}" ]]; then
    ISSUES+=("Missing required key: $key")
    continue
  fi

  if is_placeholder "${VALUES[$key]}"; then
    if [[ "$TEMPLATE_MODE" == true ]]; then
      WARNINGS+=("Template placeholder detected (expected in template mode): $key")
    else
      ISSUES+=("Required key contains placeholder/non-production value: $key")
    fi
  fi
done

if [[ -n "${VALUES[CHAT_RUNTIME_URL]+x}" ]]; then
  runtime_url="${VALUES[CHAT_RUNTIME_URL]}"
  for alias in CHAT_INTERFACE_URL LIBRECHAT_URL; do
    if [[ -n "${VALUES[$alias]+x}" && -n "${VALUES[$alias]}" && "${VALUES[$alias]}" != "$runtime_url" ]]; then
      ISSUES+=("Alias mismatch: $alias must equal CHAT_RUNTIME_URL")
    fi
  done
fi

if [[ -n "${VALUES[CHAT_RUNTIME_BRIDGE_SECRET]+x}" ]]; then
  runtime_bridge="${VALUES[CHAT_RUNTIME_BRIDGE_SECRET]}"
  for alias in CHAT_INTERFACE_BRIDGE_SECRET LIBRECHAT_BRIDGE_SECRET AIMS_BRIDGE_SHARED_SECRET; do
    if [[ -n "${VALUES[$alias]+x}" && -n "${VALUES[$alias]}" && "${VALUES[$alias]}" != "$runtime_bridge" ]]; then
      ISSUES+=("Bridge secret mismatch: $alias must match CHAT_RUNTIME_BRIDGE_SECRET")
    fi
  done
fi

if [[ -n "${VALUES[NEXTAUTH_URL]+x}" && "${VALUES[NEXTAUTH_URL]}" != https://* ]]; then
  ISSUES+=("NEXTAUTH_URL must use https:// in production")
fi
if [[ -n "${VALUES[CORS_ORIGIN]+x}" && "${VALUES[CORS_ORIGIN]}" != https://* ]]; then
  ISSUES+=("CORS_ORIGIN must use https:// in production")
fi

if [[ "$STRICT" == true ]]; then
  if [[ -z "${VALUES[II_AGENT_BRIDGE_KEY]+x}" || -z "${VALUES[II_AGENT_BRIDGE_KEY]}" ]] || is_placeholder "${VALUES[II_AGENT_BRIDGE_KEY]:-}"; then
    ISSUES+=("Strict mode: II_AGENT_BRIDGE_KEY must be set to a non-placeholder value")
  fi
fi

echo ""
echo "========================================"
echo " A.I.M.S. Env Validation"
echo " File: $PATH_ARG"
echo " Template mode: $TEMPLATE_MODE | Strict: $STRICT"
echo "========================================"

for w in "${WARNINGS[@]:-}"; do
  [[ -n "$w" ]] && echo "[WARN] $w"
done

if [[ ${#ISSUES[@]} -gt 0 ]]; then
  for i in "${ISSUES[@]}"; do
    echo "[FAIL] $i"
  done
  echo ""
  echo "Validation failed with ${#ISSUES[@]} issue(s)."
  exit 1
fi

echo "[OK] Validation passed."
