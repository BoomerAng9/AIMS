#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. — GCP Cloud Build + Cloud Run Setup
# =============================================================================
# Run this from your local terminal (or Antigravity) with gcloud CLI installed.
#
# Prerequisites:
#   1. gcloud CLI installed: https://cloud.google.com/sdk/docs/install
#   2. Authenticated: gcloud auth login
#   3. GCP project created (billing enabled)
#
# Usage:
#   chmod +x infra/gcp-setup.sh
#   ./infra/gcp-setup.sh --project YOUR_PROJECT_ID
# =============================================================================
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { printf "${GREEN}[AIMS]${NC}  %s\n" "$1"; }
warn()  { printf "${YELLOW}[AIMS]${NC}  %s\n" "$1"; }
error() { printf "${RED}[AIMS]${NC}  %s\n" "$1"; }
header(){ printf "\n${CYAN}━━━ %s ━━━${NC}\n\n" "$1"; }

# Parse arguments
PROJECT_ID="ai-managed-services"
REGION="us-central1"
REPO_NAME="aims-docker"

while [[ $# -gt 0 ]]; do
    case $1 in
        --project)  PROJECT_ID="$2"; shift 2 ;;
        --region)   REGION="$2"; shift 2 ;;
        -h|--help)
            echo "Usage: ./infra/gcp-setup.sh --project PROJECT_ID [--region REGION]"
            exit 0 ;;
        *) error "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$PROJECT_ID" ]; then
    error "Project ID required. Usage: ./infra/gcp-setup.sh --project YOUR_PROJECT_ID"
    exit 1
fi

header "A.I.M.S. GCP Setup — AI Managed Solutions"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Set project
# ─────────────────────────────────────────────────────────────────────────────
header "1/6  Setting GCP Project"
gcloud config set project "$PROJECT_ID"
info "Project: $PROJECT_ID"
info "Region: $REGION"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Enable required APIs
# ─────────────────────────────────────────────────────────────────────────────
header "2/6  Enabling APIs"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    --quiet

info "APIs enabled: Cloud Build, Cloud Run, Artifact Registry, Secret Manager"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Create Artifact Registry repo (Docker images)
# ─────────────────────────────────────────────────────────────────────────────
header "3/6  Artifact Registry"

if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
    info "Repository '$REPO_NAME' already exists."
else
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="A.I.M.S. Docker images" \
        --quiet
    info "Created repository: $REPO_NAME"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Grant Cloud Build permissions to deploy to Cloud Run
# ─────────────────────────────────────────────────────────────────────────────
header "4/6  IAM Permissions"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run Admin to Cloud Build
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/run.admin" \
    --quiet > /dev/null

# Grant Service Account User (needed for Cloud Run deploys)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet > /dev/null

info "Cloud Build SA ($CLOUD_BUILD_SA) granted Cloud Run Admin + SA User"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Connect GitHub repo (Cloud Build trigger)
# ─────────────────────────────────────────────────────────────────────────────
header "5/6  Cloud Build Trigger"

info "Creating build trigger for push-to-main..."
gcloud builds triggers create github \
    --name="aims-deploy-main" \
    --repo-owner="BoomerAng9" \
    --repo-name="AIMS" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml" \
    --substitutions="_REGION=$REGION,_REPO=$REPO_NAME" \
    --description="A.I.M.S. — Build, test, and deploy on push to main" \
    --quiet 2>/dev/null || warn "Trigger may already exist or GitHub connection needed (see below)"

info ""
info "If the trigger creation failed, connect GitHub manually:"
info "  1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=ai-managed-services"
info "  2. Click 'Connect Repository' → GitHub → BoomerAng9/AIMS"
info "  3. Create trigger: branch=main, config=cloudbuild.yaml"
info "  4. Set substitutions: _REGION=us-central1, _REPO=aims-docker"

# ─────────────────────────────────────────────────────────────────────────────
# 6. Store secrets in Secret Manager
# ─────────────────────────────────────────────────────────────────────────────
header "6/6  Secrets (Optional)"

info "To store production secrets in GCP Secret Manager:"
info ""
info "  echo -n 'your-value' | gcloud secrets create NEXTAUTH_SECRET --data-file=-"
info "  echo -n 'your-value' | gcloud secrets create OPENROUTER_API_KEY --data-file=-"
info "  echo -n 'your-value' | gcloud secrets create INTERNAL_API_KEY --data-file=-"
info "  echo -n 'your-value' | gcloud secrets create STRIPE_SECRET_KEY --data-file=-"
info ""
info "Then reference in cloudbuild.yaml with:"
info "  availableSecrets:"
info "    secretManager:"
info "      - versionName: projects/$PROJECT_ID/secrets/SECRET_NAME/versions/latest"
info "        env: SECRET_NAME"

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
echo ""
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "${GREEN}  A.I.M.S. GCP Setup Complete${NC}\n"
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo ""
info "What happens now:"
info "  1. Push to main → Cloud Build auto-triggers"
info "  2. Cloud Build: lint → test → build Docker → push to Artifact Registry → deploy to Cloud Run"
info "  3. Cloud Run serves frontend on port 3000, gateway on port 3001"
info "  4. GCP provides automatic SSL, load balancing, and auto-scaling"
info ""
info "Useful commands:"
info "  gcloud builds list --limit=5                    # Recent builds"
info "  gcloud run services list --region=$REGION       # Running services"
info "  gcloud run services describe aims-frontend \\   # Frontend URL"
info "    --region=$REGION --format='value(status.url)'"
info ""
info "Cost: Cloud Build free tier = 120 build-min/day (n1-standard-1)"
info "      Cloud Run free tier = 2M requests/month + 360K vCPU-sec"
echo ""
