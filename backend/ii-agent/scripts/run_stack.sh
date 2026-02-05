#!/usr/bin/env bash

#Set up
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "Using $ROOT_DIR"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.stack.yaml"
ENV_FILE="$ROOT_DIR/docker/.stack.env"
ENV_EXAMPLE="$ROOT_DIR/docker/.stack.env.example"
PROJECT_NAME=${COMPOSE_PROJECT_NAME:-ii-agent-stack}
BUILD_FLAG=""

usage() {
  cat <<USAGE
Usage: scripts/run_stack.sh [--build]
  --build    Force Docker to rebuild images before starting services
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--build" ]]; then
  BUILD_FLAG="--build"
  shift || true
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created $ENV_FILE from template. Populate it with real credentials before rerunning." >&2
  exit 1
fi

compose() {
  docker compose --project-name "$PROJECT_NAME" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

compose_up() {
  compose up -d ${BUILD_FLAG:+$BUILD_FLAG} "$@"
}

get_env_value() {
  local key=$1
  local default=${2:-}
  local value
  value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d '=' -f 2- || true)
  if [[ -z "$value" ]]; then
    printf '%s' "$default"
  else
    printf '%s' "$value"
  fi
}

update_env_value() {
  local key=$1
  local value=$2
  python3 - "$ENV_FILE" "$key" "$value" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
key = sys.argv[2]
value = sys.argv[3]

lines = []
found = False
for raw_line in path.read_text().splitlines():
    if not raw_line.strip() or raw_line.strip().startswith('#'):
        lines.append(raw_line)
        continue
    name, sep, current = raw_line.partition('=')
    if name == key:
        lines.append(f"{key}={value}")
        found = True
    else:
        lines.append(raw_line)

if not found:
    lines.append(f"{key}={value}")

path.write_text("\n".join(lines).rstrip() + "\n")
PY
}

ensure_frontend_build_env() {
  local backend_port
  backend_port=$(get_env_value BACKEND_PORT 8000)
  local default_api_url="http://localhost:${backend_port}"
  local current_api_url
  current_api_url=$(get_env_value VITE_API_URL)
  if [[ -z "$current_api_url" ]]; then
    update_env_value VITE_API_URL "$default_api_url"
    echo "Defaulted VITE_API_URL to $default_api_url in $ENV_FILE"
  fi

  local current_build_mode
  current_build_mode=$(get_env_value FRONTEND_BUILD_MODE)
  if [[ -z "$current_build_mode" ]]; then
    update_env_value FRONTEND_BUILD_MODE production
    echo "Defaulted FRONTEND_BUILD_MODE to production in $ENV_FILE"
  fi

  local disable_chat_mode
  disable_chat_mode=$(get_env_value VITE_DISABLE_CHAT_MODE)
  if [[ -z "$disable_chat_mode" ]]; then
    update_env_value VITE_DISABLE_CHAT_MODE false
    echo "Defaulted VITE_DISABLE_CHAT_MODE to false in $ENV_FILE"
  fi
}

wait_for_ngrok_url() {
  local port
  port=$(get_env_value NGROK_METRICS_PORT 4040)
  sleep 5

  if resp=$(curl -fsS "http://localhost:${port}/api/tunnels" 2>/dev/null); then
    url=$(
      printf '%s' "$resp" | python3 - <<'PY'
import json, sys
try:
    data = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(1)
for tunnel in data.get('tunnels', []):
    url = tunnel.get('public_url')
    if url and url.startswith('https://'):
        print(url)
        sys.exit(0)
sys.exit(1)
PY
    )
    if [[ -n "${url:-}" ]]; then
      printf '%s' "$url"
      return 0
    fi
  fi

  if log_line=$(compose logs ngrok --no-color 2>/dev/null | grep -E "url=https://" | tail -n1); then
    url=${log_line##*url=}
    url=${url%% *}
    if [[ -n "$url" ]]; then
      printf '%s' "$url"
      return 0
    fi
  fi

  return 1
}

ensure_frontend_build_env

previous_public_url=$(get_env_value PUBLIC_TOOL_SERVER_URL)

# Start shared infrastructure first so ngrok can bind once the tunnel is live.
compose_up postgres redis
compose_up tool-server sandbox-server ngrok

echo "Waiting for ngrok to publish a public HTTPS URL..."
if new_url=$(wait_for_ngrok_url); then
  current_public_url="$new_url"
  update_env_value PUBLIC_TOOL_SERVER_URL "$current_public_url"
  echo "Public tool server URL detected: $current_public_url"
else
  if [[ -n "$previous_public_url" && "$previous_public_url" != "auto" ]]; then
    echo "Unable to discover a new ngrok URL, falling back to previously configured PUBLIC_TOOL_SERVER_URL=$previous_public_url" >&2
    current_public_url="$previous_public_url"
  else
    echo "Failed to discover ngrok public URL. Check ngrok logs with 'docker compose logs ngrok'." >&2
    exit 1
  fi
fi

# Start the backend after the PUBLIC_TOOL_SERVER_URL is finalized.
compose_up backend
compose_up frontend

frontend_port=$(get_env_value FRONTEND_PORT 1420)
backend_port=$(get_env_value BACKEND_PORT 8000)
sandbox_port=$(get_env_value SANDBOX_SERVER_PORT 8100)
tool_port=$(get_env_value TOOL_SERVER_PORT 1236)
ngrok_metrics_port=$(get_env_value NGROK_METRICS_PORT 4040)

cat <<SUMMARY
Stack is running (project name: $PROJECT_NAME)
  Frontend:             http://localhost:${frontend_port}
  Backend:              http://localhost:${backend_port}
  Sandbox server:       http://localhost:${sandbox_port}
  Tool server (local):  http://localhost:${tool_port}
  Tool server (public): ${current_public_url}
  ngrok dashboard:      http://localhost:${ngrok_metrics_port}

Use 'docker compose --project-name $PROJECT_NAME -f docker/docker-compose.stack.yaml ps' to inspect containers.
SUMMARY
