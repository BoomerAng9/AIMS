#!/bin/bash
set -e

# A.I.M.S. Firebase Extensions Setup
# Installs and configures the 3 required Firebase extensions:
#   1. Stripe Payments (firestore-stripe-payments)
#   2. Send Email (firestore-send-email)
#   3. BigQuery Export (firestore-bigquery-export)
#
# Project:  AI Managed Solutions
# ID:       ai-managed-services
# Number:   1008658271134
#
# Prerequisites:
#   - Firebase CLI installed (npm install -g firebase-tools)
#   - Logged into Firebase (firebase login)
#   - Project selected (firebase use ai-managed-services)
#   - Blaze (pay-as-you-go) plan enabled
#
# Usage: bash scripts/firebase-extensions-setup.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  A.I.M.S. Firebase Extensions Setup"
echo "========================================"
echo ""

# ── Prerequisite checks ──────────────────────────────────────

if ! command -v firebase &> /dev/null; then
  echo "ERROR: Firebase CLI not installed."
  echo "  Install: npm install -g firebase-tools"
  exit 1
fi

echo "Firebase CLI: $(firebase --version)"

# Check if logged in
if ! firebase projects:list &> /dev/null 2>&1; then
  echo "ERROR: Not logged into Firebase."
  echo "  Run: firebase login"
  exit 1
fi

echo "Firebase auth: OK"

# Load env for API keys
if [ -f "$PROJECT_ROOT/infra/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/infra/.env" | xargs)
  echo "Environment: loaded from infra/.env"
else
  echo "WARNING: infra/.env not found. You'll need to enter config values manually."
fi

cd "$PROJECT_ROOT"

echo ""
echo "Target project: $(firebase use 2>/dev/null || echo 'not set - run: firebase use ai-managed-services')"
echo ""

# ── Extension 1: Stripe Payments ─────────────────────────────

echo "----------------------------------------"
echo "[1/3] Installing: firestore-stripe-payments"
echo "----------------------------------------"
echo ""
echo "This extension syncs Stripe subscriptions with Firestore."
echo "You will be prompted for configuration values."
echo ""
echo "Recommended values:"
echo "  Cloud Functions location: us-central1"
echo "  Products collection:      products"
echo "  Customers collection:     customers"
echo "  Stripe API key:           ${STRIPE_SECRET_KEY:+[set in .env]}"
echo "  Stripe webhook secret:    ${STRIPE_WEBHOOK_SECRET:+[set in .env]}"
echo "  Sync new users:           Yes"
echo ""

read -p "Install stripe extension? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  firebase ext:install stripe/firestore-stripe-payments \
    --project=ai-managed-services \
    || echo "  NOTE: If this failed, you may need to upgrade to Blaze plan first."
fi

echo ""

# ── Extension 2: Send Email ──────────────────────────────────

echo "----------------------------------------"
echo "[2/3] Installing: firestore-send-email"
echo "----------------------------------------"
echo ""
echo "This extension sends emails when documents are created in the 'mail' collection."
echo ""
echo "Recommended values:"
echo "  Cloud Functions location: us-central1"
echo "  Mail collection:          mail"
echo "  Default FROM:             noreply@plugmein.cloud"
echo "  SMTP connection URI:      smtps://apikey:${RESEND_API_KEY:+[set]}@smtp.resend.com:465"
echo "    (Uses Resend SMTP relay)"
echo ""
echo "  SMTP URI format for Resend:"
echo "    smtps://apikey:YOUR_RESEND_API_KEY@smtp.resend.com:465"
echo ""

read -p "Install email extension? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  firebase ext:install firebase/firestore-send-email \
    --project=ai-managed-services \
    || echo "  NOTE: If this failed, check your Blaze plan and SMTP credentials."
fi

echo ""

# ── Extension 3: BigQuery Export ─────────────────────────────

echo "----------------------------------------"
echo "[3/3] Installing: firestore-bigquery-export"
echo "----------------------------------------"
echo ""
echo "This extension streams Firestore changes to BigQuery for analytics."
echo ""
echo "Recommended values:"
echo "  Cloud Functions location: us-central1"
echo "  Collection path:          luc"
echo "  Dataset ID:               aims_analytics"
echo "  Table ID:                 luc_raw"
echo ""
echo "  NOTE: After installing, repeat for additional collections:"
echo "    - jobs (dataset: aims_analytics, table: jobs_raw)"
echo "    - invoices (dataset: aims_analytics, table: invoices_raw)"
echo ""

read -p "Install BigQuery export extension? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  firebase ext:install firebase/firestore-bigquery-export \
    --project=ai-managed-services \
    || echo "  NOTE: BigQuery must be enabled in GCP console first."
fi

echo ""

# ── Deploy Firestore rules and indexes ───────────────────────

echo "----------------------------------------"
echo "Deploying Firestore rules and indexes..."
echo "----------------------------------------"
echo ""

read -p "Deploy firestore.rules and firestore.indexes.json? (Y/n): " -r
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  firebase deploy --only firestore:rules,firestore:indexes \
    --project=ai-managed-services \
    || echo "  WARNING: Deploy failed. Check firebase.json and project permissions."
fi

echo ""

# ── Summary ──────────────────────────────────────────────────

echo "========================================"
echo "  Setup Summary"
echo "========================================"
echo ""
echo "Extensions configured:"
echo "  1. firestore-stripe-payments  - Syncs Stripe <-> Firestore"
echo "  2. firestore-send-email       - Sends transactional emails"
echo "  3. firestore-bigquery-export   - Streams data to BigQuery"
echo ""
echo "Next steps:"
echo "  1. Verify extensions in Firebase Console > Extensions"
echo "  2. Set up Stripe webhook endpoint (shown in extension config)"
echo "  3. Run Firestore schema init:"
echo "     cd aims-skills && npm run setup:firestore"
echo "  4. Run Stripe product setup:"
echo "     cd aims-skills && STRIPE_SECRET_KEY=sk_xxx npm run setup:stripe"
echo "  5. Test with Firebase emulators:"
echo "     firebase emulators:start"
echo "========================================"
