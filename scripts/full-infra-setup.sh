#!/bin/bash
set -e

# A.I.M.S. Full Infrastructure Setup
# Project:  AI Managed Solutions
# ID:       ai-managed-services
# Number:   1008658271134
#
# Runs all setup scripts in the correct order.
#
# Order:
#   1. GCP API activation
#   2. Firebase extensions
#   3. Firestore schema initialization
#   4. Stripe product creation
#   5. Docker stack deployment
#
# Usage: bash scripts/full-infra-setup.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  A.I.M.S. Full Infrastructure Setup"
echo "  Domain: plugmein.cloud"
echo "========================================"
echo ""
echo "This will run all setup scripts in order."
echo "You can skip individual steps if already done."
echo ""

# ── Step 1: GCP APIs ─────────────────────────────────────────

echo "========================================"
echo "  Step 1/5: GCP API Activation"
echo "========================================"
read -p "Run GCP API activation? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  bash "$SCRIPT_DIR/gcp-activate-apis.sh"
else
  echo "  Skipped."
fi
echo ""

# ── Step 2: Firebase Extensions ──────────────────────────────

echo "========================================"
echo "  Step 2/5: Firebase Extensions"
echo "========================================"
read -p "Run Firebase extensions setup? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  bash "$SCRIPT_DIR/firebase-extensions-setup.sh"
else
  echo "  Skipped."
fi
echo ""

# ── Step 3: Firestore Schema ────────────────────────────────

echo "========================================"
echo "  Step 3/5: Firestore Schema Init"
echo "========================================"
read -p "Initialize Firestore schema? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  cd "$PROJECT_ROOT/aims-skills"
  if [ ! -d "node_modules" ]; then
    echo "  Installing aims-skills dependencies..."
    npm install
  fi
  npm run setup:firestore
  cd "$PROJECT_ROOT"
else
  echo "  Skipped."
fi
echo ""

# ── Step 4: Stripe Products ─────────────────────────────────

echo "========================================"
echo "  Step 4/5: Stripe Product Setup"
echo "========================================"

if [ -z "$STRIPE_SECRET_KEY" ]; then
  # Try loading from env
  if [ -f "$PROJECT_ROOT/infra/.env" ]; then
    STRIPE_SECRET_KEY=$(grep '^STRIPE_SECRET_KEY=' "$PROJECT_ROOT/infra/.env" | cut -d= -f2)
    export STRIPE_SECRET_KEY
  fi
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "  WARNING: STRIPE_SECRET_KEY not set. Skipping."
  echo "  Set it in infra/.env or export STRIPE_SECRET_KEY=sk_xxx"
else
  read -p "Create Stripe products? (Y/n): " -r
  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    cd "$PROJECT_ROOT/aims-skills"
    npm run setup:stripe
    cd "$PROJECT_ROOT"
  else
    echo "  Skipped."
  fi
fi
echo ""

# ── Step 5: Docker Stack ────────────────────────────────────

echo "========================================"
echo "  Step 5/5: Docker Stack Deployment"
echo "========================================"
read -p "Deploy Docker stack? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  bash "$SCRIPT_DIR/setup.sh"
else
  echo "  Skipped."
fi
echo ""

# ── Done ─────────────────────────────────────────────────────

echo "========================================"
echo "  Full Infrastructure Setup Complete"
echo "========================================"
echo ""
echo "Verify everything is running:"
echo "  bash scripts/healthcheck.sh"
echo ""
echo "Firebase console:"
echo "  https://console.firebase.google.com/project/ai-managed-services"
echo ""
echo "GCP console:"
echo "  https://console.cloud.google.com/home/dashboard?project=ai-managed-services"
echo ""
echo "Stripe dashboard:"
echo "  https://dashboard.stripe.com/products"
echo "========================================"
