#!/usr/bin/env bash
# reset-demo-data.sh — Resets demo LUC data to seed state
# Run via cron every 6 hours: 0 */6 * * * /root/aims/scripts/reset-demo-data.sh
set -euo pipefail

COMPOSE_FILE="/root/aims/infra/docker-compose.prod.yml"
SEED_DIR="/root/aims/frontend/.luc-data"

echo "[$(date -Iseconds)] Resetting demo data..."

# Stop demo frontend briefly
docker compose -f "$COMPOSE_FILE" stop demo-frontend 2>/dev/null || true

# Clear demo volume and copy seed data
DEMO_VOLUME=$(docker volume inspect aims_demo-luc-data --format '{{ .Mountpoint }}' 2>/dev/null)
if [ -n "$DEMO_VOLUME" ] && [ -d "$SEED_DIR" ]; then
  rm -rf "${DEMO_VOLUME:?}"/*
  cp -a "$SEED_DIR"/. "$DEMO_VOLUME"/
  echo "[$(date -Iseconds)] Demo data reset from seed: $SEED_DIR"
else
  echo "[$(date -Iseconds)] Warning: volume or seed dir not found"
fi

# Restart demo frontend
docker compose -f "$COMPOSE_FILE" start demo-frontend 2>/dev/null || true
echo "[$(date -Iseconds)] Demo reset complete."
