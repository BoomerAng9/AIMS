#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. Production Deployment Script
# =============================================================================
# Builds, deploys, and optionally provisions SSL certificates.
# Supports dual-domain architecture:
#   --domain          = plugmein.cloud (functional app)
#   --landing-domain  = aimanagedsolutions.cloud (father site)
#
# Usage:
#   ./deploy.sh                                                  # HTTP only
#   ./deploy.sh --domain plugmein.cloud --email a@b              # App SSL only
#   ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email a@b  # Both
#   ./deploy.sh --landing-domain aimanagedsolutions.cloud --email a@b  # Landing SSL only
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
            echo "  --email EMAIL             Email for Let's Encrypt registration"
            echo "  --ssl-renew               Force renewal of all SSL certificates"
            echo "  --no-cache                Force fresh Docker image rebuild"
            echo ""
            echo "Examples:"
            echo "  ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email acheevy@aimanagedsolutions.cloud"
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

# Wait for health checks
info "Waiting for services to pass health checks..."
sleep 10

# =============================================================================
# SSL Certificate Provisioning — App Domain (plugmein.cloud)
# =============================================================================
if [ -n "${DOMAIN}" ] && [ -n "${EMAIL}" ]; then
    header "SSL Certificate Setup — App Domain (${DOMAIN})"

    # Check if certs already exist
    CERT_EXISTS=$(${COMPOSE_CMD} -f "${COMPOSE_FILE}" run --rm certbot \
        sh -c "test -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem && echo 'yes' || echo 'no'" 2>/dev/null || echo "no")

    if [ "${CERT_EXISTS}" = "yes" ] && [ "${SSL_RENEW}" = "false" ]; then
        info "SSL certificate already exists for ${DOMAIN}."
    else
        info "Requesting SSL certificate for ${DOMAIN}..."

        # Issue certificate via webroot challenge
        ${COMPOSE_CMD} -f "${COMPOSE_FILE}" run --rm certbot \
            certonly \
            --webroot \
            -w /var/www/certbot \
            -d "${DOMAIN}" \
            --email "${EMAIL}" \
            --agree-tos \
            --no-eff-email \
            --force-renewal

        info "SSL certificate issued for ${DOMAIN}."
    fi

    # Activate HTTPS nginx config for app domain
    info "Activating HTTPS server block for ${DOMAIN}..."
    SSL_CONF=$(sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${SSL_TEMPLATE}")

    # Write SSL config into the nginx conf.d volume
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
        sh -c "cat > /etc/nginx/conf.d/ssl.conf" <<< "${SSL_CONF}"

    info "App domain HTTPS config written."
fi

# =============================================================================
# SSL Certificate Provisioning — Landing Domain (aimanagedsolutions.cloud)
# =============================================================================
if [ -n "${LANDING_DOMAIN}" ] && [ -n "${EMAIL}" ]; then
    header "SSL Certificate Setup — Landing Domain (${LANDING_DOMAIN})"

    # Check if certs already exist
    LANDING_CERT_EXISTS=$(${COMPOSE_CMD} -f "${COMPOSE_FILE}" run --rm certbot \
        sh -c "test -f /etc/letsencrypt/live/${LANDING_DOMAIN}/fullchain.pem && echo 'yes' || echo 'no'" 2>/dev/null || echo "no")

    if [ "${LANDING_CERT_EXISTS}" = "yes" ] && [ "${SSL_RENEW}" = "false" ]; then
        info "SSL certificate already exists for ${LANDING_DOMAIN}."
    else
        info "Requesting SSL certificate for ${LANDING_DOMAIN} + www.${LANDING_DOMAIN}..."

        # Issue certificate via webroot challenge (includes www subdomain)
        ${COMPOSE_CMD} -f "${COMPOSE_FILE}" run --rm certbot \
            certonly \
            --webroot \
            -w /var/www/certbot \
            -d "${LANDING_DOMAIN}" \
            -d "www.${LANDING_DOMAIN}" \
            --email "${EMAIL}" \
            --agree-tos \
            --no-eff-email \
            --force-renewal

        info "SSL certificate issued for ${LANDING_DOMAIN}."
    fi

    # Activate HTTPS nginx config for landing domain
    info "Activating HTTPS server block for ${LANDING_DOMAIN}..."
    SSL_LANDING_CONF=$(sed "s/LANDING_DOMAIN_PLACEHOLDER/${LANDING_DOMAIN}/g" "${SSL_LANDING_TEMPLATE}")

    # Write SSL config into the nginx conf.d volume (separate file from app domain)
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
        sh -c "cat > /etc/nginx/conf.d/ssl-landing.conf" <<< "${SSL_LANDING_CONF}"

    info "Landing domain HTTPS config written."
fi

# =============================================================================
# Reload nginx (once, after all SSL configs are written)
# =============================================================================
if [ -n "${DOMAIN}" ] || [ -n "${LANDING_DOMAIN}" ]; then
    if [ -n "${EMAIL}" ]; then
        info "Testing and reloading nginx..."
        ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
            sh -c "nginx -t && nginx -s reload"
        info "HTTPS activated. nginx reloaded."
    fi
elif [ "${SSL_RENEW}" = "true" ]; then
    header "SSL Certificate Renewal"
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" run --rm certbot renew --webroot -w /var/www/certbot
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
