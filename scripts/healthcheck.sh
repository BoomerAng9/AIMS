#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. — Health Check Script
# Verifies all core services are running and responsive.
# Usage: bash scripts/healthcheck.sh
# =============================================================================

set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
UEF_URL="${UEF_URL:-http://localhost:3001}"
HOA_URL="${HOA_URL:-http://localhost:3002}"
ACHEEVY_URL="${ACHEEVY_URL:-http://localhost:3003}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass=0
fail=0

check_service() {
  local name="$1"
  local url="$2"

  if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC}  $name  ($url)"
    ((pass++))
  else
    echo -e "  ${RED}[FAIL]${NC} $name  ($url)"
    ((fail++))
  fi
}

echo ""
echo "=============================================="
echo "  A.I.M.S. Health Check"
echo "=============================================="
echo ""

check_service "Frontend"       "$FRONTEND_URL"
check_service "UEF Gateway"    "$UEF_URL/health"
check_service "House of Ang"   "$HOA_URL/health"
check_service "ACHEEVY"        "$ACHEEVY_URL/health"

echo ""
echo "----------------------------------------------"
echo -e "  Results: ${GREEN}${pass} passed${NC}, ${RED}${fail} failed${NC}"
echo "----------------------------------------------"

if [ "$fail" -gt 0 ]; then
  echo ""
  echo -e "  ${YELLOW}Tip: Run 'cd infra && docker compose up --build' to start services.${NC}"
  exit 1
fi

echo ""
echo -e "  ${GREEN}All services healthy.${NC}"
