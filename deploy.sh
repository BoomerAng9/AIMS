#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. Production Deployment Script
# =============================================================================
# Builds, deploys, and activates SSL for configured domains.
# SSL managed by host certbot (apt) — certs at /etc/letsencrypt, bind-mounted into nginx.
# Supports dual-domain architecture:
#   --domain          = plugmein.cloud (functional app)
#   --landing-domain  = aimanagedsolutions.cloud (father site)
#
# Usage:
#   ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud  # Standard deploy
#   ./deploy.sh --domain plugmein.cloud --email a@b              # Issue new cert + deploy
#   ./deploy.sh --ssl-renew                                      # Renew all certs
#   ./deploy.sh --no-cache                                       # Force rebuild
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/infra/docker-compose.prod.yml"
ENV_FILE="${SCRIPT_DIR}/infra/.env.production"
ENV_EXAMPLE="${SCRIPT_DIR}/infra/.env.production.example"
SSL_TEMPLATE="${SCRIPT_DIR}/infra/nginx/ssl.conf.template"
SSL_LANDING_TEMPLATE="${SCRIPT_DIR}/infra/nginx/ssl-landing.conf.template"
SSL_DEMO_TEMPLATE="${SCRIPT_DIR}/infra/nginx/demo-ssl.conf.template"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { printf "${GREEN}[AIMS]${NC}  %s\n" "$1"; }
warn()  { printf "${YELLOW}[AIMS]${NC}  %s\n" "$1"; }
error() { printf "${RED}[AIMS]${NC} %s\n" "$1"; }
header(){ printf "\n${CYAN}━━━ %s ━━━${NC}\n\n" "$1"; }

# Parse arguments
DOMAIN=""
LANDING_DOMAIN=""
EMAIL=""
SSL_RENEW=false
NO_CACHE=false
SSL_CHANGED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)         DOMAIN="$2"; shift 2 ;;
        --landing-domain) LANDING_DOMAIN="$2"; shift 2 ;;
        --email)          EMAIL="$2"; shift 2 ;;
        --ssl-renew)      SSL_RENEW=true; shift ;;
        --no-cache)       NO_CACHE=true; shift ;;
        -h|--help)
            echo "Usage: ./deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --domain DOMAIN           Functional app domain (e.g. plugmein.cloud)"
            echo "  --landing-domain DOMAIN   Landing/brand domain (e.g. aimanagedsolutions.cloud)"
            echo "  --email EMAIL             Email for initial cert issuance (optional if certs exist)"
            echo "  --ssl-renew               Force renewal of all SSL certificates"
            echo "  --no-cache                Force fresh Docker image rebuild"
            echo ""
            echo "Examples:"
            echo "  ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud"
            echo "  ./deploy.sh --domain plugmein.cloud --email admin@aimanagedsolutions.cloud  # first-time cert"
            echo "  ./deploy.sh --ssl-renew"
            exit 0 ;;
        *) error "Unknown option: $1"; exit 1 ;;
    esac
done

# Detect compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    error "docker compose is not available. Please install Docker Compose."
    exit 1
fi

# =============================================================================
# Pre-flight Checks
# =============================================================================
header "Pre-flight Checks"

if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Run: sudo ./infra/vps-setup.sh"
    exit 1
fi
info "Docker: $(docker --version)"
info "Compose: $(${COMPOSE_CMD} version)"

# Environment file
if [ ! -f "${ENV_FILE}" ]; then
    warn ".env.production not found. Copying from template..."
    cp "${ENV_EXAMPLE}" "${ENV_FILE}"
    warn "IMPORTANT: Edit ${ENV_FILE} with your actual production values."
    warn "Then re-run this script."
    exit 1
fi
info "Environment file: ${ENV_FILE}"

# Validate critical environment variables
ENV_WARNINGS=0
check_env() {
    local var_name="$1"
    local severity="$2"  # "critical" or "warn"
    local desc="$3"
    local val
    val=$(grep "^${var_name}=" "${ENV_FILE}" | cut -d'=' -f2-)
    if [ -z "${val}" ]; then
        if [ "${severity}" = "critical" ]; then
            error "MISSING: ${var_name} — ${desc}"
            ENV_WARNINGS=$((ENV_WARNINGS + 1))
        else
            warn "EMPTY:   ${var_name} — ${desc}"
        fi
    fi
}

header "Environment Validation"
check_env "NEXTAUTH_SECRET"         "critical" "Auth will not work without this"
check_env "INTERNAL_API_KEY"        "critical" "Frontend <-> backend communication key"
check_env "OPENROUTER_API_KEY"      "critical" "LLM inference (all Boomer_Angs)"
check_env "REDIS_PASSWORD"          "critical" "Redis auth (sessions + cache)"
check_env "N8N_AUTH_PASSWORD"       "critical" "n8n admin UI has no password — exposed"
check_env "STRIPE_SECRET_KEY"       "warn"     "Payments disabled"
check_env "STRIPE_WEBHOOK_SECRET"   "warn"     "Stripe webhooks will fail verification"
check_env "STRIPE_PRICE_STARTER"    "warn"     "Starter tier subscription broken"
check_env "STRIPE_PRICE_PRO"        "warn"     "Pro tier subscription broken"
check_env "STRIPE_PRICE_ENTERPRISE" "warn"     "Enterprise tier subscription broken"
check_env "ELEVENLABS_API_KEY"      "warn"     "Voice (TTS + STT) disabled"
check_env "DEEPGRAM_API_KEY"        "warn"     "Deepgram fallback STT disabled"
check_env "GOOGLE_CLIENT_ID"        "warn"     "Google OAuth login disabled"
check_env "GOOGLE_CLIENT_SECRET"    "warn"     "Google OAuth login disabled"

if [ "${ENV_WARNINGS}" -gt 0 ]; then
    error "${ENV_WARNINGS} critical variable(s) missing. Fix ${ENV_FILE} before deploying."
    exit 1
fi
info "Environment validation passed."

# Ensure certbot webroot directory exists on host (bind-mounted into nginx :ro)
mkdir -p /var/www/certbot

# If domain provided, update CORS and NEXTAUTH_URL in .env.production
if [ -n "${DOMAIN}" ]; then
    info "App domain: ${DOMAIN}"
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://${DOMAIN}|" "${ENV_FILE}"
    # CORS_ORIGIN needs both domains if landing domain is also set
    if [ -n "${LANDING_DOMAIN}" ]; then
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN},https://${LANDING_DOMAIN}|" "${ENV_FILE}"
    else
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|" "${ENV_FILE}"
    fi
    info "Updated .env.production with domain: ${DOMAIN}"
fi

if [ -n "${LANDING_DOMAIN}" ]; then
    info "Landing domain: ${LANDING_DOMAIN}"
    # Set NEXT_PUBLIC_LANDING_URL for the Next.js app to know its landing domain
    if grep -q "NEXT_PUBLIC_LANDING_URL=" "${ENV_FILE}"; then
        sed -i "s|NEXT_PUBLIC_LANDING_URL=.*|NEXT_PUBLIC_LANDING_URL=https://${LANDING_DOMAIN}|" "${ENV_FILE}"
    else
        echo "NEXT_PUBLIC_LANDING_URL=https://${LANDING_DOMAIN}" >> "${ENV_FILE}"
    fi
    # Set NEXT_PUBLIC_APP_URL for hero cards to link to the functional app
    if [ -n "${DOMAIN}" ]; then
        if grep -q "NEXT_PUBLIC_APP_URL=" "${ENV_FILE}"; then
            sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://${DOMAIN}|" "${ENV_FILE}"
        else
            echo "NEXT_PUBLIC_APP_URL=https://${DOMAIN}" >> "${ENV_FILE}"
        fi
    fi
fi

# =============================================================================
# Build
# =============================================================================
header "Building Production Images"
BUILD_FLAGS=""
if [ "${NO_CACHE}" = "true" ]; then
    BUILD_FLAGS="--no-cache --pull"
    info "Force rebuilding with --no-cache --pull (fresh images)..."
fi
${COMPOSE_CMD} -f "${COMPOSE_FILE}" build ${BUILD_FLAGS}
info "Images built successfully."

# =============================================================================
# Deploy (start services, remove orphaned containers)
# =============================================================================
header "Starting Services"
info "Stopping orphaned containers from previous deployments..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" down --remove-orphans --timeout 30
${COMPOSE_CMD} -f "${COMPOSE_FILE}" up -d --remove-orphans
info "Services started. Orphaned containers removed."

# Wait for core services to be ready before SSL provisioning
info "Waiting for core services to come up..."
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    HEALTHY=$(${COMPOSE_CMD} -f "${COMPOSE_FILE}" ps --format json 2>/dev/null | grep -c '"healthy"' || true)
    RUNNING=$(${COMPOSE_CMD} -f "${COMPOSE_FILE}" ps --format json 2>/dev/null | grep -c '"running"' || true)
    info "  Services: ${RUNNING} running, ${HEALTHY} healthy (${WAITED}s / ${MAX_WAIT}s)"
    # nginx must be running for ACME challenges — check it specifically
    NGINX_UP=$(${COMPOSE_CMD} -f "${COMPOSE_FILE}" ps nginx --format '{{.State}}' 2>/dev/null || echo "")
    if echo "${NGINX_UP}" | grep -qi "running"; then
        info "nginx is running — proceeding."
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
done
if [ $WAITED -ge $MAX_WAIT ]; then
    warn "Timed out waiting for services. Continuing anyway — check logs."
fi

# =============================================================================
# SSL Certificate Setup — App Domain (plugmein.cloud)
# Uses host certbot (apt-installed). Certs live at /etc/letsencrypt on the host,
# bind-mounted into the nginx container.
# =============================================================================
if [ -n "${DOMAIN}" ]; then
    header "SSL Setup — App Domain (${DOMAIN})"

    # Issue cert only if --email provided AND certs don't exist (or --ssl-renew)
    if [ -n "${EMAIL}" ]; then
        if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ] || [ "${SSL_RENEW}" = "true" ]; then
            info "Requesting SSL certificate for ${DOMAIN}..."
            certbot certonly \
                --webroot \
                -w /var/www/certbot \
                -d "${DOMAIN}" \
                -d "www.${DOMAIN}" \
                -d "demo.${DOMAIN}" \
                --email "${EMAIL}" \
                --agree-tos \
                --no-eff-email \
                --force-renewal
            info "SSL certificate issued for ${DOMAIN} (+ www + demo)."
        else
            info "SSL certificate already exists for ${DOMAIN}."
        fi
    fi

    # Activate HTTPS config if certs exist on disk
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        info "Activating HTTPS server block for ${DOMAIN}..."
        SSL_CONF=$(sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${SSL_TEMPLATE}")
        ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
            sh -c "cat > /etc/nginx/conf.d/ssl.conf" <<< "${SSL_CONF}"
        info "App domain HTTPS config written."

        # Activate demo subdomain HTTPS (shares cert with app domain)
        if [ -f "${SSL_DEMO_TEMPLATE}" ]; then
            info "Activating HTTPS server block for demo.${DOMAIN}..."
            ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
                sh -c "cat > /etc/nginx/conf.d/demo-ssl.conf" < "${SSL_DEMO_TEMPLATE}"
            info "Demo subdomain HTTPS config written."
        fi
        SSL_CHANGED=true
    else
        warn "No SSL cert found for ${DOMAIN}. Run with --email to issue one."
    fi
fi

# =============================================================================
# SSL Certificate Setup — Landing Domain (aimanagedsolutions.cloud)
# =============================================================================
if [ -n "${LANDING_DOMAIN}" ]; then
    header "SSL Setup — Landing Domain (${LANDING_DOMAIN})"

    # Issue cert only if --email provided AND certs don't exist (or --ssl-renew)
    if [ -n "${EMAIL}" ]; then
        if [ ! -f "/etc/letsencrypt/live/${LANDING_DOMAIN}/fullchain.pem" ] || [ "${SSL_RENEW}" = "true" ]; then
            info "Requesting SSL certificate for ${LANDING_DOMAIN} + www.${LANDING_DOMAIN}..."
            certbot certonly \
                --webroot \
                -w /var/www/certbot \
                -d "${LANDING_DOMAIN}" \
                -d "www.${LANDING_DOMAIN}" \
                --email "${EMAIL}" \
                --agree-tos \
                --no-eff-email \
                --force-renewal
            info "SSL certificate issued for ${LANDING_DOMAIN}."
        else
            info "SSL certificate already exists for ${LANDING_DOMAIN}."
        fi
    fi

    # Activate HTTPS config if certs exist on disk
    if [ -f "/etc/letsencrypt/live/${LANDING_DOMAIN}/fullchain.pem" ]; then
        info "Activating HTTPS server block for ${LANDING_DOMAIN}..."
        SSL_LANDING_CONF=$(sed "s/LANDING_DOMAIN_PLACEHOLDER/${LANDING_DOMAIN}/g" "${SSL_LANDING_TEMPLATE}")
        ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
            sh -c "cat > /etc/nginx/conf.d/ssl-landing.conf" <<< "${SSL_LANDING_CONF}"
        info "Landing domain HTTPS config written."
        SSL_CHANGED=true
    else
        warn "No SSL cert found for ${LANDING_DOMAIN}. Run with --email to issue one."
    fi
fi

# =============================================================================
# Reload nginx (once, after all SSL configs are written)
# =============================================================================
if [ "${SSL_CHANGED}" = "true" ]; then
    info "Testing and reloading nginx..."
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
        sh -c "nginx -t && nginx -s reload"
    info "HTTPS activated. nginx reloaded."
fi
if [ "${SSL_RENEW}" = "true" ] && [ -z "${DOMAIN}" ] && [ -z "${LANDING_DOMAIN}" ]; then
    header "SSL Certificate Renewal"
    certbot renew --webroot -w /var/www/certbot
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx sh -c "nginx -s reload"
    info "Certificates renewed and nginx reloaded."
fi

# =============================================================================
# Cleanup (reclaim disk space)
# =============================================================================
header "Cleanup"
info "Pruning unused images and build cache..."
docker image prune -f --filter "until=24h" 2>/dev/null || true
docker builder prune -f --filter "until=24h" 2>/dev/null || true
RECLAIMED=$(docker system df --format '{{.Reclaimable}}' 2>/dev/null | head -1 || echo "unknown")
info "Cleanup complete. Reclaimable space: ${RECLAIMED}"

# =============================================================================
# Status
# =============================================================================
header "Deployment Complete"
echo ""
${COMPOSE_CMD} -f "${COMPOSE_FILE}" ps
echo ""
info "Domains:"
if [ -n "${LANDING_DOMAIN}" ]; then
    info "  Landing   : https://${LANDING_DOMAIN}  (father site)"
fi
if [ -n "${DOMAIN}" ]; then
    info "  App       : https://${DOMAIN}  (functional site)"
    info "  API       : https://${DOMAIN}/api/gateway/"
    info "  Health    : https://${DOMAIN}/health"
fi
if [ -z "${DOMAIN}" ] && [ -z "${LANDING_DOMAIN}" ]; then
    info "  Frontend  : http://<your-ip>"
    info "  API       : http://<your-ip>/api/gateway/"
    info "  Health    : http://<your-ip>/health"
fi
echo ""
info "Commands:"
info "  Logs     : ${COMPOSE_CMD} -f ${COMPOSE_FILE} logs -f"
info "  Stop     : ${COMPOSE_CMD} -f ${COMPOSE_FILE} down"
info "  Restart  : ${COMPOSE_CMD} -f ${COMPOSE_FILE} restart"
info "  SSL renew: ./deploy.sh --ssl-renew"
echo ""