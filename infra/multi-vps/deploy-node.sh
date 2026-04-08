#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. Multi-VPS Node Deployment Script
# =============================================================================
# Deploys a secondary VPS node for plug instance overflow.
# The primary VPS runs all core services; secondary nodes run plug instances only.
#
# Usage:
#   ./infra/multi-vps/deploy-node.sh --host <IP> --ssh-key <path>
#   ./infra/multi-vps/deploy-node.sh --host 198.51.100.10 --ssh-key ~/.ssh/aims_rsa
#   ./infra/multi-vps/deploy-node.sh --host 198.51.100.10 --setup  # first-time setup
#
# Prerequisites:
#   - SSH access to the target node
#   - Docker installed on target (use --setup for first-time)
#   - Primary VPS accessible from target (for Redis, API)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NODES_FILE="${SCRIPT_DIR}/nodes.json"
PRIMARY_HOST="76.13.96.107"
SSH_KEY=""
TARGET_HOST=""
SETUP_MODE=false
NODE_ID=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { printf "${GREEN}[AIMS-NODE]${NC}  %s\n" "$1"; }
warn()  { printf "${YELLOW}[AIMS-NODE]${NC}  %s\n" "$1"; }
error() { printf "${RED}[AIMS-NODE]${NC}  %s\n" "$1"; }
header(){ printf "\n${CYAN}━━━ %s ━━━${NC}\n\n" "$1"; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --host)    TARGET_HOST="$2"; shift 2 ;;
    --ssh-key) SSH_KEY="$2"; shift 2 ;;
    --node-id) NODE_ID="$2"; shift 2 ;;
    --setup)   SETUP_MODE=true; shift ;;
    -h|--help)
      echo "Usage: ./infra/multi-vps/deploy-node.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --host IP          Target node IP address"
      echo "  --ssh-key PATH     SSH private key path"
      echo "  --node-id ID       Node identifier (default: vps-<host>)"
      echo "  --setup            First-time node setup (install Docker, etc.)"
      exit 0 ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$TARGET_HOST" ]; then
  error "Missing --host. Usage: deploy-node.sh --host <IP>"
  exit 1
fi

NODE_ID="${NODE_ID:-vps-$(echo "$TARGET_HOST" | tr '.' '-')}"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

ssh_run() {
  ssh $SSH_OPTS "root@${TARGET_HOST}" "$@"
}

scp_to() {
  scp $SSH_OPTS "$1" "root@${TARGET_HOST}:$2"
}

# ── Connectivity check ───────────────────────────────────────
header "Connectivity Check"
if ! ssh_run "echo 'Connected to \$(hostname)'" 2>/dev/null; then
  error "Cannot SSH to ${TARGET_HOST}. Check host/key."
  exit 1
fi
info "SSH connection established to ${TARGET_HOST}"

# ── First-time setup ─────────────────────────────────────────
if [ "$SETUP_MODE" = "true" ]; then
  header "First-Time Node Setup"

  info "Installing Docker..."
  ssh_run "curl -fsSL https://get.docker.com | sh"
  ssh_run "systemctl enable docker && systemctl start docker"

  info "Creating AIMS directories..."
  ssh_run "mkdir -p /opt/aims/plugs /opt/aims/nginx /opt/aims/logs"

  info "Installing health check dependencies..."
  ssh_run "apt-get update -qq && apt-get install -y -qq curl jq"

  info "First-time setup complete."
fi

# ── Deploy plug runner infrastructure ─────────────────────────
header "Deploying Plug Runner"

info "Syncing plug runner compose file..."
scp_to "${SCRIPT_DIR}/docker-compose.node.yml" "/opt/aims/docker-compose.yml"

info "Configuring environment..."
ssh_run "cat > /opt/aims/.env << 'ENVEOF'
PRIMARY_VPS_HOST=${PRIMARY_HOST}
NODE_ID=${NODE_ID}
REDIS_URL=redis://${PRIMARY_HOST}:6379
UEF_GATEWAY_URL=http://${PRIMARY_HOST}:3001
PORT_RANGE_START=51000
PORT_RANGE_END=51080
ENVEOF"

info "Starting plug runner services..."
ssh_run "cd /opt/aims && docker compose up -d"

# ── Health check ──────────────────────────────────────────────
header "Node Health Check"
info "Checking Docker on ${TARGET_HOST}..."
CONTAINERS=$(ssh_run "docker ps --format '{{.Names}}' | wc -l" 2>/dev/null || echo "0")
info "Running containers: ${CONTAINERS}"

DOCKER_INFO=$(ssh_run "docker info --format '{{.NCPU}} CPUs, {{.MemTotal}}'" 2>/dev/null || echo "unknown")
info "Node resources: ${DOCKER_INFO}"

# ── Register node ─────────────────────────────────────────────
header "Node Registration"
info "Node ${NODE_ID} deployed at ${TARGET_HOST}"
info "To add to nodes.json, append:"
echo ""
echo "  {"
echo "    \"id\": \"${NODE_ID}\","
echo "    \"host\": \"${TARGET_HOST}\","
echo "    \"role\": \"worker\","
echo "    \"cores\": $(ssh_run "nproc" 2>/dev/null || echo 4),"
echo "    \"memoryGB\": $(ssh_run "free -g | awk '/^Mem:/{print \$2}'" 2>/dev/null || echo 8),"
echo "    \"maxPlugInstances\": 8,"
echo "    \"portRange\": { \"start\": 51000, \"end\": 51080 },"
echo "    \"services\": [],"
echo "    \"tags\": [\"worker\", \"plugs\"]"
echo "  }"
echo ""

info "Done. Node ${NODE_ID} is ready to receive plug instances."
