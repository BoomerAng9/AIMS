#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. — Cloud Run Deployment Script
# =============================================================================
# Deploys stateless services to Cloud Run and triggers VPS-side stateful deploy.
#
# Usage:
#   ./infra/cloudrun/deploy-cloudrun.sh                  # Deploy all services
#   ./infra/cloudrun/deploy-cloudrun.sh --service frontend  # Deploy one service
#   ./infra/cloudrun/deploy-cloudrun.sh --jobs              # Deploy Cloud Run Jobs
#   ./infra/cloudrun/deploy-cloudrun.sh --all               # Services + Jobs
#
# Requirements:
#   - gcloud CLI authenticated with ai-managed-services project
#   - Artifact Registry: us-central1-docker.pkg.dev/ai-managed-services/aims-docker
#   - Secret Manager secrets provisioned
# =============================================================================

set -euo pipefail

PROJECT_ID="ai-managed-services"
REGION="us-central1"
REPO="aims-docker"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[  ok  ]${NC} $*"; }
warn() { echo -e "${YELLOW}[ warn ]${NC} $*"; }
err()  { echo -e "${RED}[error]${NC} $*" >&2; }

# ── Parse Args ──────────────────────────────────────────────────────────────
TARGET_SERVICE=""
DEPLOY_JOBS=false
DEPLOY_ALL=false
TAG="latest"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)  TARGET_SERVICE="$2"; shift 2 ;;
    --jobs)     DEPLOY_JOBS=true; shift ;;
    --all)      DEPLOY_ALL=true; shift ;;
    --tag)      TAG="$2"; shift 2 ;;
    *)          err "Unknown arg: $1"; exit 1 ;;
  esac
done

# ── Preflight ───────────────────────────────────────────────────────────────
log "Preflight checks..."
command -v gcloud >/dev/null || { err "gcloud CLI not found"; exit 1; }
command -v docker >/dev/null || { err "docker not found"; exit 1; }

CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
  warn "Switching gcloud project to ${PROJECT_ID}"
  gcloud config set project "$PROJECT_ID"
fi

ok "Project: ${PROJECT_ID} | Region: ${REGION} | Tag: ${TAG}"

# ── Build + Push Images ────────────────────────────────────────────────────
build_and_push() {
  local name="$1"
  local dockerfile="$2"
  local context="$3"
  local image="${REGISTRY}/${name}:${TAG}"

  log "Building ${name}..."
  docker build -t "$image" -f "$dockerfile" "$context"
  docker push "$image"
  ok "Pushed ${image}"
}

deploy_service() {
  local yaml="$1"
  local name
  name=$(basename "$yaml" .service.yaml)

  log "Deploying Cloud Run service: ${name}..."
  gcloud run services replace "$yaml" --region "$REGION" --quiet
  ok "Deployed ${name}"
}

deploy_job() {
  local yaml="$1"
  local name
  name=$(basename "$yaml" .job.yaml)

  log "Deploying Cloud Run job: ${name}..."
  gcloud run jobs replace "$yaml" --region "$REGION" --quiet
  ok "Deployed job ${name}"
}

# ── Service Deployments ────────────────────────────────────────────────────
if [ -n "$TARGET_SERVICE" ]; then
  # Single service
  YAML="${SCRIPT_DIR}/${TARGET_SERVICE}.service.yaml"
  if [ ! -f "$YAML" ]; then
    err "Service YAML not found: ${YAML}"
    exit 1
  fi
  deploy_service "$YAML"
elif [ "$DEPLOY_JOBS" = true ]; then
  # Jobs only
  for yaml in "${SCRIPT_DIR}"/*.job.yaml; do
    [ -f "$yaml" ] && deploy_job "$yaml"
  done
elif [ "$DEPLOY_ALL" = true ]; then
  # Everything
  log "Deploying all Cloud Run services..."
  for yaml in "${SCRIPT_DIR}"/*.service.yaml; do
    [ -f "$yaml" ] && deploy_service "$yaml"
  done
  log "Deploying all Cloud Run jobs..."
  for yaml in "${SCRIPT_DIR}"/*.job.yaml; do
    [ -f "$yaml" ] && deploy_job "$yaml"
  done
else
  # Default: services only
  log "Deploying all Cloud Run services..."
  for yaml in "${SCRIPT_DIR}"/*.service.yaml; do
    [ -f "$yaml" ] && deploy_service "$yaml"
  done
fi

echo ""
ok "Cloud Run deployment complete."
log "Service URLs:"
gcloud run services list --region "$REGION" --format="table(metadata.name,status.url)" 2>/dev/null || true
