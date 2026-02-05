#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. — Setup Script
# Installs dependencies and prepares the environment for local development.
# Usage: bash scripts/setup.sh
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=============================================="
echo "  A.I.M.S. Setup"
echo "=============================================="

# --- Environment file ---
if [ ! -f infra/.env ]; then
  echo "[setup] Creating .env from template..."
  cp infra/.env.example infra/.env
  echo "[setup] IMPORTANT: Edit infra/.env with your API keys before starting."
else
  echo "[setup] .env already exists, skipping."
fi

# --- Frontend ---
echo ""
echo "[setup] Installing frontend dependencies..."
(cd frontend && npm install)

# --- UEF Gateway ---
echo ""
echo "[setup] Installing UEF Gateway dependencies..."
(cd backend/uef-gateway && npm install)

# --- House of Ang ---
echo ""
echo "[setup] Installing House of Ang dependencies..."
(cd backend/house-of-ang && npm install)

# --- ACHEEVY ---
echo ""
echo "[setup] Installing ACHEEVY dependencies..."
(cd backend/acheevy && npm install)

echo ""
echo "=============================================="
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Edit infra/.env with your API keys"
echo "    2. Run: cd infra && docker compose up --build"
echo "    3. Open: http://localhost:3000"
echo "=============================================="
