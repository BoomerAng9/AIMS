#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. Hybrid Deployment Script
# =============================================================================
# Deploys A.I.M.S. in hybrid mode:
#   Cloud Run → frontend + uef-gateway (stateless, auto-scaling, managed)
#   VPS       → Redis, n8n, Agent Bridge, agents (stateful, persistent)
#
# Usage:
#   ./scripts/deploy-hybrid.sh                     # Deploy both tiers
#   ./scripts/deploy-hybrid.sh --cloud-only        # Deploy Cloud Run only
#   ./scripts/deploy-hybrid.sh --vps-only          # Deploy VPS stack only
#   ./scripts/deploy-hybrid.sh --with-agents       # Include tier1 agents
#   ./scripts/deploy-hybrid.sh --with-n8n          # Include n8n
#   ./scripts/deploy-hybrid.sh --dry-run           # Print commands without executing
#
# Prerequisites:
#   - gcloud CLI authenticated (for Cloud Run)
#   - SSH access to VPS at 76.13.96.107 (for VPS stack)
#   - Docker installed locally and on VPS
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { printf "${GREEN}[AIMS]${NC}  %s\n" "$1"; }
warn()  { printf "${YELLOW}[AIMS]${NC}  %s\n" "$1"; }
error() { printf "${RED}[AIMS]${NC}  %s\n" "$1"; }
header(){ printf "\n${CYAN}${BOLD}━━━ %s ━━━${NC}\n\n" "$1"; }

# ── Configuration ──
GCP_PROJECT="${GCP_PROJECT:-ai-managed-services}"
GCP_REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO="${ARTIFACT_REPO:-aims-docker}"
VPS_HOST="${VPS_HOST:-76.13.96.107}"
VPS_USER="${VPS_USER:-root}"
VPS_DEPLOY_PATH="${VPS_DEPLOY_PATH:-/root/aims}"
COMPOSE_VPS="infra/docker-compose.vps.yml"
ENV_FILE="infra/.env.production"

# ── Parse Arguments ──
DEPLOY_CLOUD=true
DEPLOY_VPS=true
WITH_AGENTS=false
WITH_N8N=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --cloud-only)  DEPLOY_VPS=false; shift ;;
        --vps-only)    DEPLOY_CLOUD=false; shift ;;
        --with-agents) WITH_AGENTS=true; shift ;;
        --with-n8n)    WITH_N8N=true; shift ;;
        --dry-run)     DRY_RUN=true; shift ;;
        -h|--help)
            echo "Usage: ./scripts/deploy-hybrid.sh [options]"
            echo ""
            echo "Options:"
            echo "  --cloud-only    Deploy Cloud Run services only"
            echo "  --vps-only      Deploy VPS stateful services only"
            echo "  --with-agents   Include tier1 agents (research-ang, router-ang)"
            echo "  --with-n8n      Include n8n workflow engine"
            echo "  --dry-run       Print commands without executing"
            echo ""
            echo "Environment:"
            echo "  GCP_PROJECT     GCP project ID (default: ai-managed-services)"
            echo "  GCP_REGION      GCP region (default: us-central1)"
            echo "  VPS_HOST        VPS IP address (default: 76.13.96.107)"
            echo "  VPS_USER        VPS SSH user (default: root)"
            exit 0 ;;
        *) error "Unknown option: $1"; exit 1 ;;
    esac
done

run() {
    if [ "${DRY_RUN}" = "true" ]; then
        echo "  [dry-run] $*"
    else
        "$@"
    fi
}

# =============================================================================
# Pre-flight
# =============================================================================
header "A.I.M.S. Hybrid Deployment"

echo "  Configuration:"
echo "    Cloud Run:    ${DEPLOY_CLOUD}"
echo "    VPS Stack:    ${DEPLOY_VPS}"
echo "    Agents:       ${WITH_AGENTS}"
echo "    n8n:          ${WITH_N8N}"
echo "    GCP Project:  ${GCP_PROJECT}"
echo "    GCP Region:   ${GCP_REGION}"
echo "    VPS Host:     ${VPS_HOST}"
echo "    Dry Run:      ${DRY_RUN}"
echo ""

# =============================================================================
# TIER 1: Cloud Run (Stateless Services)
# =============================================================================
if [ "${DEPLOY_CLOUD}" = "true" ]; then
    header "TIER 1: Cloud Run Deployment (Stateless)"

    # Check gcloud auth
    if ! gcloud auth print-access-token &>/dev/null 2>&1; then
        error "gcloud is not authenticated. Run: gcloud auth login"
        exit 1
    fi
    info "GCP authenticated as $(gcloud config get-value account 2>/dev/null)"

    REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REPO}"
    TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

    # ── Build + Push Gateway Image ──
    info "Building UEF Gateway image..."
    run docker build \
        -t "${REGISTRY}/uef-gateway:${TAG}" \
        -t "${REGISTRY}/uef-gateway:latest" \
        -f "${PROJECT_ROOT}/backend/uef-gateway/Dockerfile" \
        "${PROJECT_ROOT}/backend/uef-gateway"

    info "Pushing UEF Gateway image..."
    run docker push "${REGISTRY}/uef-gateway:${TAG}"
    run docker push "${REGISTRY}/uef-gateway:latest"

    # ── Build + Push Frontend Image ──
    info "Building Frontend image..."
    run docker build \
        -t "${REGISTRY}/frontend:${TAG}" \
        -t "${REGISTRY}/frontend:latest" \
        -f "${PROJECT_ROOT}/frontend/Dockerfile" \
        "${PROJECT_ROOT}/frontend"

    info "Pushing Frontend image..."
    run docker push "${REGISTRY}/frontend:${TAG}"
    run docker push "${REGISTRY}/frontend:latest"

    # ── Deploy Gateway to Cloud Run ──
    info "Deploying UEF Gateway to Cloud Run..."
    run gcloud run deploy aims-gateway \
        --image="${REGISTRY}/uef-gateway:${TAG}" \
        --region="${GCP_REGION}" \
        --platform=managed \
        --port=3001 \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=3 \
        --allow-unauthenticated \
        --set-env-vars="NODE_ENV=production,PORT=3001,LOG_LEVEL=info,AGENT_BRIDGE_URL=https://plugmein.cloud/api/bridge,REDIS_URL=redis://${VPS_HOST}:6379,N8N_URL=http://${VPS_HOST}:5678,RESEARCH_ANG_URL=http://${VPS_HOST}:3020,ROUTER_ANG_URL=http://${VPS_HOST}:3021" \
        --update-secrets="INTERNAL_API_KEY=INTERNAL_API_KEY:latest,OPENROUTER_API_KEY=OPENROUTER_API_KEY:latest,REDIS_PASSWORD=REDIS_PASSWORD:latest"

    # Get Cloud Run URLs
    GATEWAY_URL=$(gcloud run services describe aims-gateway --region="${GCP_REGION}" --format='value(status.url)' 2>/dev/null || echo "https://aims-gateway-xxx.run.app")
    info "Gateway deployed: ${GATEWAY_URL}"

    # ── Deploy Frontend to Cloud Run ──
    info "Deploying Frontend to Cloud Run..."
    run gcloud run deploy aims-frontend \
        --image="${REGISTRY}/frontend:${TAG}" \
        --region="${GCP_REGION}" \
        --platform=managed \
        --port=3000 \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=5 \
        --allow-unauthenticated \
        --set-env-vars="NODE_ENV=production,UEF_ENDPOINT=${GATEWAY_URL}" \
        --update-secrets="NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,INTERNAL_API_KEY=INTERNAL_API_KEY:latest"

    FRONTEND_URL=$(gcloud run services describe aims-frontend --region="${GCP_REGION}" --format='value(status.url)' 2>/dev/null || echo "https://aims-frontend-xxx.run.app")
    info "Frontend deployed: ${FRONTEND_URL}"

    info "Cloud Run deployment complete!"
fi

# =============================================================================
# TIER 2: VPS (Stateful Services)
# =============================================================================
if [ "${DEPLOY_VPS}" = "true" ]; then
    header "TIER 2: VPS Deployment (Stateful)"

    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${VPS_USER}@${VPS_HOST}" true 2>/dev/null; then
        error "Cannot SSH to ${VPS_USER}@${VPS_HOST}. Check your SSH key."
        exit 1
    fi
    info "SSH connection verified: ${VPS_USER}@${VPS_HOST}"

    # ── Sync project to VPS ──
    info "Syncing project to VPS..."
    run rsync -az --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='.env.production' \
        "${PROJECT_ROOT}/" "${VPS_USER}@${VPS_HOST}:${VPS_DEPLOY_PATH}/"

    # ── Sync env file separately ──
    if [ -f "${PROJECT_ROOT}/${ENV_FILE}" ]; then
        info "Syncing environment file..."
        run rsync -az "${PROJECT_ROOT}/${ENV_FILE}" "${VPS_USER}@${VPS_HOST}:${VPS_DEPLOY_PATH}/${ENV_FILE}"
    fi

    # ── Build VPS compose profiles ──
    PROFILES=""
    if [ "${WITH_AGENTS}" = "true" ]; then
        PROFILES="${PROFILES} --profile tier1-agents"
    fi
    if [ "${WITH_N8N}" = "true" ]; then
        PROFILES="${PROFILES} --profile n8n"
    fi

    # ── Set Cloud Run gateway URL for VPS services ──
    CLOUD_RUN_GW="${GATEWAY_URL:-https://aims-gateway-xxx.run.app}"

    # ── Deploy on VPS ──
    info "Building and starting VPS stack..."
    run ssh "${VPS_USER}@${VPS_HOST}" bash -s <<REMOTE_SCRIPT
set -euo pipefail
cd ${VPS_DEPLOY_PATH}

# Export Cloud Run gateway URL for VPS services
export CLOUD_RUN_GATEWAY_URL="${CLOUD_RUN_GW}"

# Build images
docker compose -f ${COMPOSE_VPS} ${PROFILES} build

# Start services
docker compose -f ${COMPOSE_VPS} ${PROFILES} up -d

# Wait for health
echo "Waiting for services to start..."
sleep 10

# Show status
docker compose -f ${COMPOSE_VPS} ps
REMOTE_SCRIPT

    info "VPS deployment complete!"
fi

# =============================================================================
# Summary
# =============================================================================
header "Deployment Complete"

echo "  ┌──────────────────────────────────────────────────┐"
echo "  │  A.I.M.S. Hybrid Deployment Summary              │"
echo "  ├──────────────────────────────────────────────────┤"
if [ "${DEPLOY_CLOUD}" = "true" ]; then
echo "  │  CLOUD RUN (stateless, auto-scaling)             │"
echo "  │    Frontend:     ${FRONTEND_URL:-N/A}"
echo "  │    UEF Gateway:  ${GATEWAY_URL:-N/A}"
fi
if [ "${DEPLOY_VPS}" = "true" ]; then
echo "  │  VPS @ ${VPS_HOST} (stateful, persistent)         │"
echo "  │    Redis:        :6379 (internal)                │"
echo "  │    Agent Bridge:  :3010 (internal)               │"
echo "  │    Agent Zero:   :50001 (sandboxed)              │"
if [ "${WITH_AGENTS}" = "true" ]; then
echo "  │    Research_Ang: :3020 (A2A)                     │"
echo "  │    Router_Ang:   :3021 (A2A)                     │"
fi
if [ "${WITH_N8N}" = "true" ]; then
echo "  │    n8n:          :5678 (workflows)               │"
fi
fi
echo "  └──────────────────────────────────────────────────┘"
echo ""
info "Monitoring:"
info "  Cloud Run logs:  gcloud run services logs read aims-gateway --region=${GCP_REGION}"
info "  VPS logs:        ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_DEPLOY_PATH} && docker compose -f ${COMPOSE_VPS} logs -f'"
info "  Health:          curl https://plugmein.cloud/health"
echo ""
