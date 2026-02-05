#!/bin/bash

# A.I.M.S. Health Check
# Usage: bash scripts/healthcheck.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$PROJECT_ROOT/infra"

echo "========================================"
echo "  A.I.M.S. Health Check"
echo "========================================"
echo ""

PASS=0
FAIL=0
WARN=0

check_service() {
  local name="$1"
  local url="$2"
  local required="${3:-true}"

  if curl -fsS --max-time 5 "$url" > /dev/null 2>&1; then
    echo "  [OK]   $name"
    PASS=$((PASS + 1))
  else
    if [ "$required" = "true" ]; then
      echo "  [FAIL] $name ($url)"
      FAIL=$((FAIL + 1))
    else
      echo "  [WARN] $name ($url) -- optional"
      WARN=$((WARN + 1))
    fi
  fi
}

check_container() {
  local name="$1"
  local container="$2"

  local state
  state=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)

  if [ "$state" = "running" ]; then
    echo "  [OK]   $name (container: $container)"
    PASS=$((PASS + 1))
  elif [ -n "$state" ]; then
    echo "  [FAIL] $name (state: $state)"
    FAIL=$((FAIL + 1))
  else
    echo "  [FAIL] $name (container not found: $container)"
    FAIL=$((FAIL + 1))
  fi
}

# ── Docker daemon ────────────────────────────────────────────

echo "Docker:"
if docker info &> /dev/null 2>&1; then
  echo "  [OK]   Docker daemon running"
  PASS=$((PASS + 1))
else
  echo "  [FAIL] Docker daemon not running"
  FAIL=$((FAIL + 1))
  echo ""
  echo "Cannot proceed without Docker. Run: sudo systemctl start docker"
  exit 1
fi

# ── HTTP endpoints ───────────────────────────────────────────

echo ""
echo "HTTP Endpoints:"
check_service "Frontend (Next.js)"         "http://localhost:3000"
check_service "UEF Gateway"                "http://localhost:3001/health"
check_service "II-Agent Backend"           "http://localhost:4001/health"
check_service "II-Agent Sandbox"           "http://localhost:4100/health"
check_service "II-Agent Tools"             "http://localhost:4036/health"
check_service "OpenClaw"                   "http://localhost:18789/health"  false
check_service "n8n"                        "http://localhost:5678/healthz"  false

# ── Database / cache ─────────────────────────────────────────

echo ""
echo "Databases & Cache:"

# PostgreSQL (main)
if docker exec -i "$(docker compose -f "$INFRA_DIR/docker-compose.yml" ps -q postgres 2>/dev/null)" pg_isready -U postgres -d aims > /dev/null 2>&1; then
  echo "  [OK]   PostgreSQL (main, port 5432)"
  PASS=$((PASS + 1))
else
  echo "  [FAIL] PostgreSQL (main, port 5432)"
  FAIL=$((FAIL + 1))
fi

# PostgreSQL (ii-agent)
if docker exec -i "$(docker compose -f "$INFRA_DIR/docker-compose.yml" ps -q ii-agent-postgres 2>/dev/null)" pg_isready -U iiagent -d iiagentdev > /dev/null 2>&1; then
  echo "  [OK]   PostgreSQL (ii-agent, port 5433)"
  PASS=$((PASS + 1))
else
  echo "  [FAIL] PostgreSQL (ii-agent, port 5433)"
  FAIL=$((FAIL + 1))
fi

# Redis
if docker exec -i "$(docker compose -f "$INFRA_DIR/docker-compose.yml" ps -q ii-agent-redis 2>/dev/null)" redis-cli ping 2>/dev/null | grep -q PONG; then
  echo "  [OK]   Redis (ii-agent, port 6380)"
  PASS=$((PASS + 1))
else
  echo "  [FAIL] Redis (ii-agent, port 6380)"
  FAIL=$((FAIL + 1))
fi

# ── Summary ──────────────────────────────────────────────────

echo ""
echo "========================================"
TOTAL=$((PASS + FAIL + WARN))
echo "  Results: $PASS passed, $FAIL failed, $WARN warnings ($TOTAL checks)"

if [ "$FAIL" -eq 0 ]; then
  echo "  Status: All required services healthy"
else
  echo "  Status: $FAIL service(s) need attention"
  echo ""
  echo "Troubleshooting:"
  echo "  docker compose -f $INFRA_DIR/docker-compose.yml ps"
  echo "  docker compose -f $INFRA_DIR/docker-compose.yml logs <service-name>"
fi
echo "========================================"
