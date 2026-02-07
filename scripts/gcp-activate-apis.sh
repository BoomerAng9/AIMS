#!/bin/bash
set -e

# A.I.M.S. GCP API Activation Script
# Enables all required Google Cloud APIs for the A.I.M.S. platform.
#
# Project:  AI Managed Solutions
# ID:       ai-managed-services
# Number:   1008658271134
#
# Prerequisites:
#   - gcloud CLI installed (https://cloud.google.com/sdk/docs/install)
#   - Authenticated: gcloud auth login
#   - Project set: gcloud config set project ai-managed-services
#
# Usage: bash scripts/gcp-activate-apis.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load project ID from env or use default
if [ -f "$PROJECT_ROOT/infra/.env" ]; then
  GCP_PROJECT=$(grep '^GCP_PROJECT_ID=' "$PROJECT_ROOT/infra/.env" | cut -d= -f2)
fi
GCP_PROJECT="${GCP_PROJECT:-ai-managed-services}"

echo "========================================"
echo "  A.I.M.S. GCP API Activation"
echo "  Project: $GCP_PROJECT"
echo "========================================"
echo ""

# ── Prerequisite checks ──────────────────────────────────────

if ! command -v gcloud &> /dev/null; then
  echo "ERROR: gcloud CLI not installed."
  echo "  Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo "gcloud CLI: $(gcloud --version 2>/dev/null | head -1)"

# Verify project access
if ! gcloud projects describe "$GCP_PROJECT" &> /dev/null 2>&1; then
  echo "ERROR: Cannot access project '$GCP_PROJECT'."
  echo "  Run: gcloud auth login"
  echo "  Then: gcloud config set project $GCP_PROJECT"
  exit 1
fi

echo "Project access: OK"
echo ""

# ── Core Infrastructure APIs ─────────────────────────────────

echo "[1/5] Enabling core infrastructure APIs..."

gcloud services enable \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  --project="$GCP_PROJECT" \
  --quiet

echo "  OK: Resource Manager, IAM, Compute Engine, GKE"
echo ""

# ── Firebase & Firestore ─────────────────────────────────────

echo "[2/5] Enabling Firebase & Firestore APIs..."

gcloud services enable \
  firebase.googleapis.com \
  firestore.googleapis.com \
  firebaserules.googleapis.com \
  firebasehosting.googleapis.com \
  cloudfunctions.googleapis.com \
  --project="$GCP_PROJECT" \
  --quiet

echo "  OK: Firebase, Firestore, Cloud Functions"
echo ""

# ── AI & ML APIs ─────────────────────────────────────────────

echo "[3/5] Enabling AI/ML APIs..."

gcloud services enable \
  aiplatform.googleapis.com \
  vision.googleapis.com \
  speech.googleapis.com \
  texttospeech.googleapis.com \
  translate.googleapis.com \
  language.googleapis.com \
  videointelligence.googleapis.com \
  --project="$GCP_PROJECT" \
  --quiet

echo "  OK: Vertex AI, Vision, Speech, TTS, Translate, NLP, Video Intelligence"
echo ""

# ── Storage & Data ───────────────────────────────────────────

echo "[4/5] Enabling storage & data APIs..."

gcloud services enable \
  storage.googleapis.com \
  bigquery.googleapis.com \
  pubsub.googleapis.com \
  cloudrun.googleapis.com \
  --project="$GCP_PROJECT" \
  --quiet

echo "  OK: Cloud Storage, BigQuery, Pub/Sub, Cloud Run"
echo ""

# ── Service Account ──────────────────────────────────────────

echo "[5/5] Checking service account..."

SA_NAME="aims-backend"
SA_EMAIL="${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$SA_EMAIL" --project="$GCP_PROJECT" &> /dev/null 2>&1; then
  echo "  Service account exists: $SA_EMAIL"
else
  echo "  Creating service account: $SA_NAME..."

  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="A.I.M.S. Backend Service Account" \
    --project="$GCP_PROJECT" \
    --quiet

  # Grant roles
  for role in \
    roles/datastore.user \
    roles/firebase.admin \
    roles/storage.objectAdmin \
    roles/bigquery.dataEditor \
    roles/aiplatform.user \
    roles/cloudfunctions.invoker; do

    gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
      --member="serviceAccount:$SA_EMAIL" \
      --role="$role" \
      --quiet \
      > /dev/null 2>&1
  done

  echo "  Roles granted: Firestore, Firebase Admin, Storage, BigQuery, Vertex AI, Functions"
fi

echo ""

# ── Key file generation ──────────────────────────────────────

KEY_FILE="$PROJECT_ROOT/infra/gcp-service-account-key.json"
if [ ! -f "$KEY_FILE" ]; then
  read -p "Generate service account key file? (y/N): " -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    gcloud iam service-accounts keys create "$KEY_FILE" \
      --iam-account="$SA_EMAIL" \
      --project="$GCP_PROJECT"
    echo "  Key saved to: $KEY_FILE"
    echo "  WARNING: Add this file to .gitignore (should already be covered by *.json patterns)"
  fi
else
  echo "  Key file exists: $KEY_FILE"
fi

echo ""

# ── Summary ──────────────────────────────────────────────────

echo "========================================"
echo "  GCP API Activation Complete"
echo "========================================"
echo ""
echo "Enabled API groups:"
echo "  Infrastructure:  Resource Manager, IAM, Compute, GKE"
echo "  Firebase:        Firebase, Firestore, Functions, Hosting"
echo "  AI/ML:           Vertex AI, Vision, Speech, TTS, NLP, Video Intel"
echo "  Data:            Storage, BigQuery, Pub/Sub, Cloud Run"
echo ""
echo "Service account: $SA_EMAIL"
echo ""
echo "Next steps:"
echo "  1. Set GOOGLE_APPLICATION_CREDENTIALS=$KEY_FILE"
echo "  2. Run: bash scripts/firebase-extensions-setup.sh"
echo "  3. Run: cd aims-skills && npm run setup:firestore"
echo "========================================"
