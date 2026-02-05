#!/bin/bash
set -e

# A.I.M.S. Platform Setup for plugmein.cloud
# Targets: Hostinger VPS with Docker Engine (no Docker Desktop)
# Usage: bash scripts/setup.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$PROJECT_ROOT/infra"
ENV_FILE="$INFRA_DIR/.env"

echo "========================================"
echo "  A.I.M.S. Platform Setup"
echo "  Target: plugmein.cloud"
echo "========================================"
echo ""

# ── Step 1: Check prerequisites ──────────────────────────────

echo "[1/6] Checking prerequisites..."

if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker not found."
  echo "  Install: curl -fsSL https://get.docker.com | sh"
  echo "  Then:    sudo systemctl enable docker && sudo systemctl start docker"
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo "ERROR: Docker Compose V2 not found."
  echo "  Install: sudo apt-get install docker-compose-plugin"
  exit 1
fi

echo "  Docker: $(docker --version)"
echo "  Compose: $(docker compose version)"

# Check Docker daemon is running
if ! docker info &> /dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running."
  echo "  Run: sudo systemctl start docker"
  exit 1
fi

echo "  Docker daemon: running"

# ── Step 2: Check environment file ───────────────────────────

echo ""
echo "[2/6] Checking environment configuration..."

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Missing $ENV_FILE"
  echo "  Copy the example and fill in your API keys:"
  echo "  cp $INFRA_DIR/.env.example $ENV_FILE"
  exit 1
fi

# Validate critical keys are not empty
MISSING_KEYS=()
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  # Strip whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  # Check critical keys
  case "$key" in
    OPENROUTER_API_KEY|ANTHROPIC_API_KEY|DB_PASSWORD)
      if [ -z "$value" ] || [ "$value" = "xxxxxxxxxxxxx" ] || [ "$value" = "sk-ant-xxxxxxxxxxxxx" ]; then
        MISSING_KEYS+=("$key")
      fi
      ;;
  esac
done < "$ENV_FILE"

if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
  echo "WARNING: The following critical keys appear unset in $ENV_FILE:"
  for k in "${MISSING_KEYS[@]}"; do
    echo "  - $k"
  done
  echo ""
  read -p "Continue anyway? (y/N): " -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "  Environment file: OK"
fi

# ── Step 3: Pull base images ─────────────────────────────────

echo ""
echo "[3/6] Pulling base Docker images..."

cd "$INFRA_DIR"
docker compose pull postgres ii-agent-postgres ii-agent-redis 2>&1 | tail -5

# ── Step 4: Build custom services ─────────────────────────────

echo ""
echo "[4/6] Building custom service images..."

docker compose build --parallel 2>&1 | tail -10

# ── Step 5: Start all services ────────────────────────────────

echo ""
echo "[5/6] Starting all services..."

docker compose up -d

echo ""
echo "Waiting for services to initialize..."
sleep 15

# ── Step 6: Health check ──────────────────────────────────────

echo ""
echo "[6/6] Running health checks..."
echo ""

bash "$SCRIPT_DIR/healthcheck.sh"

echo ""
echo "========================================"
echo "  Setup complete."
echo "  Dashboard: http://$(hostname -I | awk '{print $1}'):3000"
echo "  UEF API:   http://$(hostname -I | awk '{print $1}'):3001"
echo "========================================"
echo ""
echo "Useful commands:"
echo "  docker compose -f $INFRA_DIR/docker-compose.yml logs -f         # stream all logs"
echo "  docker compose -f $INFRA_DIR/docker-compose.yml logs uef-gateway # single service"
echo "  docker compose -f $INFRA_DIR/docker-compose.yml ps               # service status"
echo "  docker compose -f $INFRA_DIR/docker-compose.yml down             # stop everything"
echo "  bash $SCRIPT_DIR/healthcheck.sh                                  # re-run health checks"
