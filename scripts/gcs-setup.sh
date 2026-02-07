#!/bin/bash
set -e

# A.I.M.S. GCS Setup Script
# Creates Google Cloud Storage buckets for ii-agent and configures credentials.
#
# Project:  AI Managed Solutions
# ID:       ai-managed-services
# Number:   1008658271134
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - GCP project set: gcloud config set project ai-managed-services
#   - Service account created (run scripts/gcp-activate-apis.sh first)
#
# Usage: bash scripts/gcs-setup.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load project ID
if [ -f "$PROJECT_ROOT/infra/.env" ]; then
  GCP_PROJECT=$(grep '^GCP_PROJECT_ID=' "$PROJECT_ROOT/infra/.env" | cut -d= -f2)
fi
GCP_PROJECT="${GCP_PROJECT:-ai-managed-services}"

# Bucket names (globally unique — prefixed with project ID)
BUCKET_PREFIX="${GCP_PROJECT}"
STORAGE_BUCKET="${BUCKET_PREFIX}-ii-agent-storage"
AVATARS_BUCKET="${BUCKET_PREFIX}-avatars"
SLIDES_BUCKET="${BUCKET_PREFIX}-slide-assets"
REGION="${GCS_REGION:-us-central1}"

SA_NAME="aims-backend"
SA_EMAIL="${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com"
KEY_FILE="$PROJECT_ROOT/infra/gcp-service-account-key.json"

echo "========================================"
echo "  A.I.M.S. GCS Storage Setup"
echo "  Project: $GCP_PROJECT"
echo "  Region:  $REGION"
echo "========================================"
echo ""

# ── Prerequisite checks ──────────────────────────────────────

if ! command -v gcloud &> /dev/null; then
  echo "ERROR: gcloud CLI not installed."
  echo "  Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Verify Storage API is enabled
if ! gcloud services list --enabled --filter="name:storage.googleapis.com" --project="$GCP_PROJECT" --format="value(name)" 2>/dev/null | grep -q storage; then
  echo "Enabling Cloud Storage API..."
  gcloud services enable storage.googleapis.com --project="$GCP_PROJECT" --quiet
fi

echo "Cloud Storage API: Enabled"
echo ""

# ── Create Buckets ────────────────────────────────────────────

create_bucket() {
  local bucket_name=$1
  local description=$2

  if gcloud storage buckets describe "gs://${bucket_name}" --project="$GCP_PROJECT" &> /dev/null 2>&1; then
    echo "  [EXISTS] gs://${bucket_name} — ${description}"
  else
    echo "  [CREATE] gs://${bucket_name} — ${description}"
    gcloud storage buckets create "gs://${bucket_name}" \
      --project="$GCP_PROJECT" \
      --location="$REGION" \
      --uniform-bucket-level-access \
      --quiet
  fi
}

echo "[1/4] Creating storage buckets..."
echo ""

create_bucket "$STORAGE_BUCKET" "Tool server file storage (uploads, search results, generated images)"
create_bucket "$AVATARS_BUCKET"  "User avatar storage"
create_bucket "$SLIDES_BUCKET"  "Slide assets (permanent public URLs)"

echo ""

# ── Set public access on slide assets bucket ──────────────────

echo "[2/4] Configuring bucket permissions..."

# Slide assets need public read access for permanent URLs
gcloud storage buckets add-iam-policy-binding "gs://${SLIDES_BUCKET}" \
  --member="allUsers" \
  --role="roles/storage.objectViewer" \
  --project="$GCP_PROJECT" \
  --quiet 2>/dev/null || true

echo "  Public read: gs://${SLIDES_BUCKET}"

# Grant service account access to all buckets
for bucket in "$STORAGE_BUCKET" "$AVATARS_BUCKET" "$SLIDES_BUCKET"; do
  gcloud storage buckets add-iam-policy-binding "gs://${bucket}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/storage.objectAdmin" \
    --project="$GCP_PROJECT" \
    --quiet 2>/dev/null || true
done

echo "  Service account access: $SA_EMAIL → all buckets"
echo ""

# ── Set CORS on storage bucket (for signed URL uploads) ──────

echo "[3/4] Setting CORS policy on storage bucket..."

CORS_FILE=$(mktemp)
cat > "$CORS_FILE" << 'CORS_EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "HEAD"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
CORS_EOF

gcloud storage buckets update "gs://${STORAGE_BUCKET}" \
  --cors-file="$CORS_FILE" \
  --project="$GCP_PROJECT" \
  --quiet 2>/dev/null || true

rm -f "$CORS_FILE"
echo "  CORS configured on gs://${STORAGE_BUCKET}"
echo ""

# ── Generate/verify service account key ──────────────────────

echo "[4/4] Service account credentials..."

if [ ! -f "$KEY_FILE" ]; then
  echo "  Generating service account key..."
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL" \
    --project="$GCP_PROJECT"
  echo "  Key saved to: $KEY_FILE"
else
  echo "  Key file exists: $KEY_FILE"
fi

# Copy key to ii-agent docker directory for container mounting
II_AGENT_CREDS="$PROJECT_ROOT/backend/ii-agent/docker/gcp-credentials.json"
cp "$KEY_FILE" "$II_AGENT_CREDS"
echo "  Copied to: $II_AGENT_CREDS"
echo ""

# ── Update .stack.env ─────────────────────────────────────────

STACK_ENV="$PROJECT_ROOT/backend/ii-agent/docker/.stack.env"

if [ -f "$STACK_ENV" ]; then
  echo "Updating .stack.env with GCS configuration..."

  # Tool server storage
  sed -i "s|^STORAGE_CONFIG__STORAGE_PROVIDER=.*|STORAGE_CONFIG__STORAGE_PROVIDER=gcs|" "$STACK_ENV"
  sed -i "s|^STORAGE_CONFIG__GCS_BUCKET_NAME=.*|STORAGE_CONFIG__GCS_BUCKET_NAME=${STORAGE_BUCKET}|" "$STACK_ENV"
  sed -i "s|^STORAGE_CONFIG__GCS_PROJECT_ID=.*|STORAGE_CONFIG__GCS_PROJECT_ID=${GCP_PROJECT}|" "$STACK_ENV"

  # Backend storage (file uploads, avatars, slides)
  sed -i "s|^FILE_UPLOAD_PROJECT_ID=.*|FILE_UPLOAD_PROJECT_ID=${GCP_PROJECT}|" "$STACK_ENV"
  sed -i "s|^FILE_UPLOAD_BUCKET_NAME=.*|FILE_UPLOAD_BUCKET_NAME=${STORAGE_BUCKET}|" "$STACK_ENV"
  sed -i "s|^AVATAR_PROJECT_ID=.*|AVATAR_PROJECT_ID=${GCP_PROJECT}|" "$STACK_ENV"
  sed -i "s|^AVATAR_BUCKET_NAME=.*|AVATAR_BUCKET_NAME=${AVATARS_BUCKET}|" "$STACK_ENV"
  sed -i "s|^SLIDE_ASSETS_PROJECT_ID=.*|SLIDE_ASSETS_PROJECT_ID=${GCP_PROJECT}|" "$STACK_ENV"
  sed -i "s|^SLIDE_ASSETS_BUCKET_NAME=.*|SLIDE_ASSETS_BUCKET_NAME=${SLIDES_BUCKET}|" "$STACK_ENV"

  # Credentials path (container-internal path)
  sed -i "s|^GOOGLE_APPLICATION_CREDENTIALS=.*|GOOGLE_APPLICATION_CREDENTIALS=/app/google-application-credentials.json|" "$STACK_ENV"

  echo "  .stack.env updated"
else
  echo "  WARNING: $STACK_ENV not found — update manually"
fi

echo ""

# ── Update docker-compose credentials mount ───────────────────

COMPOSE_FILE="$PROJECT_ROOT/backend/ii-agent/docker/docker-compose.stack.yaml"

if [ -f "$COMPOSE_FILE" ]; then
  # Check if dummy credentials mount is still used
  if grep -q "dummy-credentials" "$COMPOSE_FILE"; then
    echo "NOTE: docker-compose.stack.yaml still references .dummy-credentials.json"
    echo "  Update the volume mount to use the real credentials file:"
    echo "    - ./gcp-credentials.json:/app/google-application-credentials.json:ro"
  fi
fi

echo ""

# ── Summary ──────────────────────────────────────────────────

echo "========================================"
echo "  GCS Setup Complete"
echo "========================================"
echo ""
echo "Buckets created:"
echo "  gs://${STORAGE_BUCKET}  — tool-server + file uploads"
echo "  gs://${AVATARS_BUCKET}  — user avatars"
echo "  gs://${SLIDES_BUCKET}   — slide assets (public)"
echo ""
echo "Credentials:"
echo "  Key file:     $KEY_FILE"
echo "  Docker copy:  $II_AGENT_CREDS"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose volume mounts to use real credentials:"
echo "     - ./gcp-credentials.json:/app/google-application-credentials.json:ro"
echo ""
echo "  2. Rebuild and restart ii-agent stack:"
echo "     cd backend/ii-agent/docker"
echo "     docker compose -f docker-compose.stack.yaml --env-file .stack.env down"
echo "     docker compose -f docker-compose.stack.yaml --env-file .stack.env up -d"
echo ""
echo "  3. Verify tool-server health:"
echo "     curl http://localhost:\${TOOL_SERVER_PORT:-1236}/health"
echo "========================================"
