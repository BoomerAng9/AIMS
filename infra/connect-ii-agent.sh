#!/usr/bin/env bash
# =============================================================================
# connect-ii-agent.sh — Wire ii-agent into the AIMS stack
# =============================================================================
#
# This script validates prerequisites, generates missing secrets, and starts
# ii-agent alongside the existing AIMS stack using Docker Compose overlay.
#
# Usage:
#   ./infra/connect-ii-agent.sh              # interactive setup + start
#   ./infra/connect-ii-agent.sh --check      # validate only, don't start
#   ./infra/connect-ii-agent.sh --down       # stop ii-agent containers
#   ./infra/connect-ii-agent.sh --status     # show ii-agent health
#
# Prerequisites:
#   - Docker Engine + Compose v2 installed
#   - AIMS stack running (docker-compose.prod.yml)
#   - infra/.env.ii-agent file with at least ANTHROPIC_API_KEY set
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_PROD="$SCRIPT_DIR/docker-compose.prod.yml"
COMPOSE_II="$SCRIPT_DIR/docker-compose.ii-agent.yaml"
ENV_FILE="$SCRIPT_DIR/.env.ii-agent"
ENV_EXAMPLE="$SCRIPT_DIR/.env.ii-agent.example"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[ii-agent]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ii-agent]${NC} $*"; }
error() { echo -e "${RED}[ii-agent]${NC} $*" >&2; }
info()  { echo -e "${BLUE}[ii-agent]${NC} $*"; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
check_docker() {
  if ! command -v docker &>/dev/null; then
    error "Docker not found. Install with: curl -fsSL https://get.docker.com | sh"
    exit 1
  fi
  if ! docker compose version &>/dev/null; then
    error "Docker Compose v2 not found. Update Docker or install compose plugin."
    exit 1
  fi
  log "Docker Engine + Compose v2: OK"
}

check_aims_running() {
  local gw_status
  gw_status=$(docker inspect --format='{{.State.Status}}' aims-uef-gateway 2>/dev/null || echo "not_found")
  if [ "$gw_status" != "running" ]; then
    warn "AIMS stack (uef-gateway) is not running."
    warn "Start it first: ./deploy.sh --domain plugmein.cloud"
    return 1
  fi
  log "AIMS stack: running"
  return 0
}

check_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    warn "No .env.ii-agent found. Creating from example..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    info "Created $ENV_FILE — please fill in required values."
    return 1
  fi

  # Check required vars
  local missing=0
  if ! grep -q '^ANTHROPIC_API_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
    error "ANTHROPIC_API_KEY is required but empty in $ENV_FILE"
    missing=1
  fi

  # Auto-generate DB password if missing
  if ! grep -q '^II_AGENT_DB_PASSWORD=.\+' "$ENV_FILE" 2>/dev/null; then
    local pw
    pw=$(openssl rand -base64 24 2>/dev/null || head -c 24 /dev/urandom | base64)
    sed -i "s/^II_AGENT_DB_PASSWORD=.*/II_AGENT_DB_PASSWORD=$pw/" "$ENV_FILE"
    log "Auto-generated II_AGENT_DB_PASSWORD"
  fi

  if [ "$missing" -eq 1 ]; then
    error "Fix the missing values above in: $ENV_FILE"
    return 1
  fi

  log "Environment file: OK"
  return 0
}

# ---------------------------------------------------------------------------
# Compose helpers
# ---------------------------------------------------------------------------
compose_cmd() {
  docker compose \
    -f "$COMPOSE_PROD" \
    -f "$COMPOSE_II" \
    --env-file "$ENV_FILE" \
    "$@"
}

start_ii_agent() {
  log "Starting ii-agent containers..."
  compose_cmd up -d ii-agent ii-agent-postgres ii-agent-tools ii-agent-sandbox
  log "Waiting for health checks..."
  sleep 5

  local retries=0
  local max_retries=12
  while [ $retries -lt $max_retries ]; do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' aims-ii-agent 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      log "ii-agent is healthy and connected to AIMS network"
      return 0
    fi
    retries=$((retries + 1))
    info "Waiting for ii-agent to become healthy... ($retries/$max_retries)"
    sleep 5
  done

  warn "ii-agent did not become healthy within 60s. Check logs:"
  warn "  docker logs aims-ii-agent --tail 50"
  return 1
}

stop_ii_agent() {
  log "Stopping ii-agent containers..."
  compose_cmd stop ii-agent ii-agent-postgres ii-agent-tools ii-agent-sandbox
  compose_cmd rm -f ii-agent ii-agent-postgres ii-agent-tools ii-agent-sandbox
  log "ii-agent containers stopped and removed"
}

show_status() {
  echo ""
  info "=== II-Agent Status ==="
  echo ""

  for svc in aims-ii-agent aims-ii-agent-postgres aims-ii-agent-tools aims-ii-agent-sandbox; do
    local status health
    status=$(docker inspect --format='{{.State.Status}}' "$svc" 2>/dev/null || echo "not found")
    health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' "$svc" 2>/dev/null || echo "n/a")
    printf "  %-30s status=%-10s health=%s\n" "$svc" "$status" "$health"
  done

  echo ""

  # Test WebSocket connectivity from UEF Gateway
  local gw_test
  gw_test=$(docker exec aims-uef-gateway sh -c 'curl -sf http://ii-agent:8000/health 2>/dev/null' || echo '{"error":"unreachable"}')
  info "UEF Gateway → ii-agent connectivity: $gw_test"
  echo ""
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  local action="${1:-setup}"

  case "$action" in
    --check)
      check_docker
      check_aims_running || true
      check_env_file || true
      ;;
    --down)
      check_docker
      stop_ii_agent
      ;;
    --status)
      show_status
      ;;
    *)
      echo ""
      info "=========================================="
      info "  II-Agent → AIMS Connection Setup"
      info "=========================================="
      echo ""

      check_docker
      check_env_file || exit 1
      check_aims_running || warn "Proceeding anyway — ii-agent will connect when AIMS starts."
      echo ""
      start_ii_agent
      echo ""
      show_status
      echo ""
      log "Done. ii-agent is ready."
      log "Admin panel: https://plugmein.cloud/dashboard/admin/ii-agent"
      log "Logs:        docker logs aims-ii-agent -f"
      ;;
  esac
}

main "$@"
