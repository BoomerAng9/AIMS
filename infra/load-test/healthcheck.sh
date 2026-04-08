#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. VPS Health Check Script
# =============================================================================
# Quick health check for all core services. Run manually or via cron.
#
# Usage:
#   ./infra/load-test/healthcheck.sh
#   ./infra/load-test/healthcheck.sh --json    # machine-readable output
#   ./infra/load-test/healthcheck.sh --verbose # show response times
# =============================================================================
set -euo pipefail

BASE_URL="${AIMS_BASE_URL:-https://plugmein.cloud}"
JSON_MODE=false
VERBOSE=false

for arg in "$@"; do
  case $arg in
    --json)    JSON_MODE=true ;;
    --verbose) VERBOSE=true ;;
  esac
done

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
RESULTS=()

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"
  local start_ms
  start_ms=$(date +%s%N)

  local status
  status=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

  local end_ms
  end_ms=$(date +%s%N)
  local duration_ms=$(( (end_ms - start_ms) / 1000000 ))

  if [ "$status" = "$expected" ]; then
    PASS=$((PASS + 1))
    if [ "$JSON_MODE" = "false" ]; then
      printf "${GREEN}✓${NC} %-25s %s (%dms)\n" "$name" "$status" "$duration_ms"
    fi
    RESULTS+=("{\"name\":\"$name\",\"status\":\"pass\",\"http\":$status,\"ms\":$duration_ms}")
  else
    FAIL=$((FAIL + 1))
    if [ "$JSON_MODE" = "false" ]; then
      printf "${RED}✗${NC} %-25s %s (expected %s, %dms)\n" "$name" "$status" "$expected" "$duration_ms"
    fi
    RESULTS+=("{\"name\":\"$name\",\"status\":\"fail\",\"http\":$status,\"expected\":$expected,\"ms\":$duration_ms}")
  fi
}

if [ "$JSON_MODE" = "false" ]; then
  echo ""
  echo "A.I.M.S. Health Check — $(date)"
  echo "Target: $BASE_URL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# Core services
check "nginx (root)"        "$BASE_URL/"
check "API health"          "$BASE_URL/api/health"
check "Per|Form stats"      "$BASE_URL/api/perform/stats"
check "Per|Form gridiron"   "$BASE_URL/api/perform/gridiron"
check "Per|Form prospects"  "$BASE_URL/api/perform/prospects?limit=1"
check "Discover page"       "$BASE_URL/discover"
check "Dashboard"           "$BASE_URL/dashboard"

# Docker container status
if command -v docker &> /dev/null; then
  RUNNING=$(docker ps --format '{{.Names}}' 2>/dev/null | wc -l || echo 0)
  UNHEALTHY=$(docker ps --filter "health=unhealthy" --format '{{.Names}}' 2>/dev/null | wc -l || echo 0)

  if [ "$JSON_MODE" = "false" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Docker: $RUNNING containers running, $UNHEALTHY unhealthy"
  fi
fi

# Host resources
if [ "$VERBOSE" = "true" ] && [ "$JSON_MODE" = "false" ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Host Resources:"
  printf "  CPU:    %s\n" "$(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' 2>/dev/null || echo 'N/A')%"
  printf "  Memory: %s\n" "$(free -h | awk '/^Mem:/{printf "%s / %s (%s used)", $3, $2, $3/$2*100"%"}' 2>/dev/null || echo 'N/A')"
  printf "  Disk:   %s\n" "$(df -h / | awk 'NR==2{printf "%s / %s (%s)", $3, $2, $5}' 2>/dev/null || echo 'N/A')"
fi

TOTAL=$((PASS + FAIL))

if [ "$JSON_MODE" = "true" ]; then
  echo "{\"timestamp\":\"$(date -Iseconds)\",\"target\":\"$BASE_URL\",\"pass\":$PASS,\"fail\":$FAIL,\"total\":$TOTAL,\"checks\":[$(IFS=,; echo "${RESULTS[*]}")]}"
else
  echo ""
  if [ "$FAIL" -eq 0 ]; then
    printf "${GREEN}All $TOTAL checks passed.${NC}\n"
  else
    printf "${RED}$FAIL of $TOTAL checks failed.${NC}\n"
  fi
fi

exit $FAIL
