#!/usr/bin/env bash
#
# arena-daily-cron.sh — Autonomous Daily Contest Generator
#
# Run this via cron to auto-generate the daily contest slate:
#   0 6 * * * /path/to/scripts/arena-daily-cron.sh >> /var/log/arena-cron.log 2>&1
#
# Or add to n8n as a scheduled workflow.
#
# WHAT IT DOES:
#   1. Hits the generate endpoint to create today's contests
#   2. Imports fresh trivia questions
#   3. Logs the results
#

set -euo pipefail

APP_URL="${ARENA_APP_URL:-http://localhost:3000}"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX Starting daily arena generation..."

# Generate contest slate
echo "$LOG_PREFIX Generating contests..."
GENERATE_RESULT=$(curl -s -X POST "$APP_URL/api/arena/generate")
GENERATED_COUNT=$(echo "$GENERATE_RESULT" | grep -o '"generated":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo "$LOG_PREFIX Generated $GENERATED_COUNT contests"

# Import additional trivia (3 batches for variety)
echo "$LOG_PREFIX Importing trivia batch 1/3 (general)..."
curl -s -X POST "$APP_URL/api/arena/import/trivia?amount=50&category=9" > /dev/null

echo "$LOG_PREFIX Importing trivia batch 2/3 (sports)..."
curl -s -X POST "$APP_URL/api/arena/import/trivia?amount=50&category=21" > /dev/null

echo "$LOG_PREFIX Importing trivia batch 3/3 (science)..."
curl -s -X POST "$APP_URL/api/arena/import/trivia?amount=50&category=17" > /dev/null

echo "$LOG_PREFIX Daily arena generation complete. $GENERATED_COUNT contests created."
