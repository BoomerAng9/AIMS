#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. Production Deployment Script
# =============================================================================
# Builds, deploys, and optionally provisions SSL certificates.
#
# Usage:
#   ./deploy.sh                                         # HTTP only (no SSL)
#   ./deploy.sh --domain aims.example.com --email a@b   # Full SSL setup
#   ./deploy.sh --ssl-renew                             # Force cert renewal
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/infra/docker-compose.prod.yml"
ENV_FILE="${SCRIPT_DIR}/infra/.env.production"
ENV_EXAMPLE="${SCRIPT_DIR}/infra/.env.production.example"
SSL_TEMPLATE="${SCRIPT_DIR}/infra/nginx/ssl.conf.template"

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
EMAIL=""
SSL_RENEW=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)  DOMAIN="$2"; shift 2 ;;
        --email)   EMAIL="$2"; shift 2 ;;
        --ssl-renew) SSL_RENEW=true; shift ;;
        -h|--help)
            echo "Usage: ./deploy.sh [--domain DOMAIN --email EMAIL] [--ssl-renew]"
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
    info "Domain: ${DOMAIN}"
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://${DOMAIN}|" "${ENV_FILE}"
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|" "${ENV_FILE}"
    info "Updated .env.production with domain: ${DOMAIN}"
fi

# =============================================================================
# Build
# =============================================================================
header "Building Production Images"
${COMPOSE_CMD} -f "${COMPOSE_FILE}" build
info "Images built successfully."

# =============================================================================
# Deploy (start services)
# =============================================================================
header "Starting Services"
${COMPOSE_CMD} -f "${COMPOSE_FILE}" up -d
info "Services started."

# Wait for health checks
info "Waiting for services to pass health checks..."
sleep 10

# =============================================================================
# SSL Certificate Provisioning (Let's Encrypt)
# =============================================================================
if [ -n "${DOMAIN}" ] && [ -n "${EMAIL}" ]; then
    header "SSL Certificate Setup"

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

    # Activate HTTPS nginx config
    info "Activating HTTPS server block..."
    SSL_CONF=$(sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${SSL_TEMPLATE}")

    # Write SSL config into the nginx conf.d volume
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
        sh -c "cat > /etc/nginx/conf.d/ssl.conf" <<< "${SSL_CONF}"

    # Reload nginx with new SSL config
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx \
        sh -c "nginx -t && nginx -s reload"

    info "HTTPS activated. nginx reloaded."

elif [ "${SSL_RENEW}" = "true" ]; then
    header "SSL Certificate Renewal"
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" run --rm certbot renew --webroot -w /var/www/certbot
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T nginx sh -c "nginx -s reload"
    info "Certificates renewed and nginx reloaded."
fi

# =============================================================================
# Status
# =============================================================================
header "Deployment Complete"
echo ""
${COMPOSE_CMD} -f "${COMPOSE_FILE}" ps
echo ""
info "Services:"
if [ -n "${DOMAIN}" ]; then
    info "  Frontend  : https://${DOMAIN}"
    info "  API       : https://${DOMAIN}/api/gateway/"
    info "  Health    : https://${DOMAIN}/health"
else
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
