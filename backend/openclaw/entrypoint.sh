#!/bin/sh
set -e

echo "🦞 Starting OpenClaw Gateway for A.I.M.S..."

# Run onboarding if not already done
if [ ! -f "/app/workspace/.openclaw-initialized" ]; then
  echo "🦞 Running first-time setup..."
  openclaw onboard --non-interactive 2>/dev/null || true
  touch /app/workspace/.openclaw-initialized
fi

# Start the gateway
exec openclaw gateway \
  --port 18789 \
  --host 0.0.0.0 \
  --config /app/config/openclaw.toml \
  --verbose
