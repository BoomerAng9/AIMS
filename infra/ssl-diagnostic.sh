#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. SSL Diagnostic Script
# =============================================================================
# Run this ON the VPS (76.13.96.107) to diagnose SSL/TLS issues.
#
# Usage:
#   ssh aims@76.13.96.107
#   cd ~/AIMS && bash infra/ssl-diagnostic.sh
# =============================================================================
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass()  { printf "  ${GREEN}[PASS]${NC}  %s\n" "$1"; }
fail()  { printf "  ${RED}[FAIL]${NC}  %s\n" "$1"; }
warn()  { printf "  ${YELLOW}[WARN]${NC}  %s\n" "$1"; }
info()  { printf "  ${CYAN}[INFO]${NC}  %s\n" "$1"; }
header(){ printf "\n${CYAN}━━━ %s ━━━${NC}\n\n" "$1"; }

DOMAINS=(
    "plugmein.cloud"
    "www.plugmein.cloud"
    "aimanagedsolutions.cloud"
    "www.aimanagedsolutions.cloud"
)

VPS_IP="76.13.96.107"
HOSTINGER_SHARED_IP="76.13.132.174"

# =============================================================================
header "1. DNS Resolution"
# =============================================================================
for domain in "${DOMAINS[@]}"; do
    resolved=$(dig +short A "$domain" 2>/dev/null | head -1)
    if [ -z "$resolved" ]; then
        fail "$domain — no A record found"
    elif [ "$resolved" = "$VPS_IP" ]; then
        pass "$domain → $resolved (VPS — correct)"
    elif [ "$resolved" = "$HOSTINGER_SHARED_IP" ]; then
        fail "$domain → $resolved (Hostinger shared hosting — WRONG! Should be $VPS_IP)"
    else
        warn "$domain → $resolved (unknown IP — should be $VPS_IP)"
    fi
done

# =============================================================================
header "2. Docker Containers Running"
# =============================================================================
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    fail "docker compose not found"
    COMPOSE_CMD=""
fi

if [ -n "$COMPOSE_CMD" ]; then
    nginx_running=$(docker ps --filter "name=nginx" --format "{{.Names}} {{.Status}}" 2>/dev/null)
    certbot_running=$(docker ps --filter "name=certbot" --format "{{.Names}} {{.Status}}" 2>/dev/null)

    if [ -n "$nginx_running" ]; then
        pass "Nginx: $nginx_running"
    else
        fail "Nginx container is NOT running"
    fi

    if [ -n "$certbot_running" ]; then
        pass "Certbot: $certbot_running"
    else
        warn "Certbot container is not running (may be expected if using run --rm)"
    fi
fi

# =============================================================================
header "3. Ports 80 and 443"
# =============================================================================
if ss -tlnp 2>/dev/null | grep -q ':80 '; then
    pass "Port 80 is listening"
else
    fail "Port 80 is NOT listening"
fi

if ss -tlnp 2>/dev/null | grep -q ':443 '; then
    pass "Port 443 is listening"
else
    fail "Port 443 is NOT listening — SSL cannot work"
fi

# =============================================================================
header "4. Let's Encrypt Certificates"
# =============================================================================
CERT_BASE="/etc/letsencrypt/live"
# Check if certs are accessible via the certbot volume or directly on host
if [ -d "$CERT_BASE" ]; then
    CERT_ACCESS="host"
else
    CERT_ACCESS="docker"
fi

check_cert() {
    local domain="$1"
    local cert_path

    if [ "$CERT_ACCESS" = "host" ]; then
        cert_path="$CERT_BASE/$domain/fullchain.pem"
        if [ ! -f "$cert_path" ]; then
            fail "$domain — certificate NOT found at $cert_path"
            return
        fi
        # Check expiry
        expiry=$(openssl x509 -enddate -noout -in "$cert_path" 2>/dev/null | cut -d= -f2)
        if [ -n "$expiry" ]; then
            expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
            now_epoch=$(date +%s)
            days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
            # Check SANs
            sans=$(openssl x509 -text -noout -in "$cert_path" 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 | sed 's/DNS://g; s/,/ /g; s/^ *//')

            if [ "$days_left" -le 0 ]; then
                fail "$domain — EXPIRED ($expiry)"
            elif [ "$days_left" -le 14 ]; then
                warn "$domain — expires in $days_left days ($expiry)"
            else
                pass "$domain — valid, expires in $days_left days ($expiry)"
            fi
            info "  SANs: $sans"
        fi
    else
        # Try via docker
        local container
        container=$(docker ps --filter "name=nginx" --format "{{.Names}}" | head -1)
        if [ -z "$container" ]; then
            fail "$domain — cannot check (nginx container not running)"
            return
        fi
        exists=$(docker exec "$container" sh -c "test -f /etc/letsencrypt/live/$domain/fullchain.pem && echo yes || echo no" 2>/dev/null)
        if [ "$exists" = "yes" ]; then
            expiry=$(docker exec "$container" sh -c "openssl x509 -enddate -noout -in /etc/letsencrypt/live/$domain/fullchain.pem 2>/dev/null | cut -d= -f2" 2>/dev/null)
            sans=$(docker exec "$container" sh -c "openssl x509 -text -noout -in /etc/letsencrypt/live/$domain/fullchain.pem 2>/dev/null | grep -A1 'Subject Alternative Name' | tail -1" 2>/dev/null | sed 's/DNS://g; s/,/ /g; s/^ *//')
            if [ -n "$expiry" ]; then
                expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
                now_epoch=$(date +%s)
                days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
                if [ "$days_left" -le 0 ]; then
                    fail "$domain — EXPIRED ($expiry)"
                elif [ "$days_left" -le 14 ]; then
                    warn "$domain — expires in $days_left days ($expiry)"
                else
                    pass "$domain — valid, expires in $days_left days ($expiry)"
                fi
                info "  SANs: $sans"
            else
                warn "$domain — cert exists but could not read expiry"
            fi
        else
            fail "$domain — certificate NOT found in container"
        fi
    fi
}

check_cert "plugmein.cloud"
check_cert "aimanagedsolutions.cloud"

# =============================================================================
header "5. Nginx SSL Config Files"
# =============================================================================
container=$(docker ps --filter "name=nginx" --format "{{.Names}}" | head -1 2>/dev/null)
if [ -n "$container" ]; then
    ssl_conf=$(docker exec "$container" sh -c "test -f /etc/nginx/conf.d/ssl.conf && echo exists || echo missing" 2>/dev/null)
    ssl_landing_conf=$(docker exec "$container" sh -c "test -f /etc/nginx/conf.d/ssl-landing.conf && echo exists || echo missing" 2>/dev/null)

    if [ "$ssl_conf" = "exists" ]; then
        pass "ssl.conf (plugmein.cloud HTTPS) — present"
    else
        fail "ssl.conf — MISSING (run deploy.sh with --domain to create it)"
    fi

    if [ "$ssl_landing_conf" = "exists" ]; then
        pass "ssl-landing.conf (aimanagedsolutions.cloud HTTPS) — present"
    else
        fail "ssl-landing.conf — MISSING (run deploy.sh with --landing-domain to create it)"
    fi

    # Test nginx config
    nginx_test=$(docker exec "$container" nginx -t 2>&1)
    if echo "$nginx_test" | grep -q "successful"; then
        pass "nginx config test — OK"
    else
        fail "nginx config test — FAILED"
        echo "$nginx_test"
    fi
else
    fail "Cannot check — nginx container not running"
fi

# =============================================================================
header "6. Live HTTPS Connectivity"
# =============================================================================
for domain in "${DOMAINS[@]}"; do
    resolved=$(dig +short A "$domain" 2>/dev/null | head -1)
    if [ "$resolved" != "$VPS_IP" ]; then
        warn "$domain — skipping (not pointed at this VPS)"
        continue
    fi

    # Test HTTPS connection
    http_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "https://$domain/" 2>/dev/null || echo "000")
    if [ "$http_code" = "000" ]; then
        fail "$domain — HTTPS connection failed (timeout or SSL error)"
        # Try to get SSL error details
        ssl_err=$(curl -vI --max-time 5 "https://$domain/" 2>&1 | grep -i "ssl\|certificate\|error" | head -3)
        if [ -n "$ssl_err" ]; then
            info "  SSL error details:"
            echo "$ssl_err" | while read -r line; do info "    $line"; done
        fi
    elif [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        redirect_to=$(curl -sS -o /dev/null -w "%{redirect_url}" --max-time 10 "https://$domain/" 2>/dev/null)
        pass "$domain — HTTPS works (${http_code} → $redirect_to)"
    elif [ "$http_code" = "200" ]; then
        pass "$domain — HTTPS works (200 OK)"
    else
        warn "$domain — HTTPS returned HTTP $http_code"
    fi
done

# =============================================================================
header "7. HTTP → HTTPS Redirect"
# =============================================================================
for domain in "${DOMAINS[@]}"; do
    resolved=$(dig +short A "$domain" 2>/dev/null | head -1)
    if [ "$resolved" != "$VPS_IP" ]; then
        continue
    fi

    http_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "http://$domain/" 2>/dev/null || echo "000")
    if [ "$http_code" = "301" ]; then
        redirect_to=$(curl -sS -o /dev/null -w "%{redirect_url}" --max-time 10 "http://$domain/" 2>/dev/null)
        pass "$domain — HTTP redirects to HTTPS ($redirect_to)"
    elif [ "$http_code" = "200" ]; then
        warn "$domain — HTTP serves content directly (no redirect to HTTPS)"
    else
        info "$domain — HTTP returned $http_code"
    fi
done

# =============================================================================
header "8. www.plugmein.cloud Status"
# =============================================================================
info "ssl.conf.template now includes www.plugmein.cloud support."
info "Both plugmein.cloud and www.plugmein.cloud should redirect correctly."
info "Verify: curl -sI https://www.plugmein.cloud | grep -i location"

# =============================================================================
header "9. Firewall (UFW)"
# =============================================================================
if command -v ufw &>/dev/null; then
    ufw_status=$(sudo ufw status 2>/dev/null | head -5)
    if echo "$ufw_status" | grep -q "443"; then
        pass "UFW allows port 443"
    else
        fail "UFW may be blocking port 443"
    fi
    echo "$ufw_status"
else
    info "UFW not installed (firewall check skipped)"
fi

# =============================================================================
header "Summary"
# =============================================================================
echo ""
info "If certs are expired or missing:"
info "  ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud"
echo ""
info "If certs exist but nginx doesn't have SSL configs:"
info "  Re-run deploy.sh (it writes ssl.conf and ssl-landing.conf into nginx)"
echo ""
info "If DNS points to 76.13.132.174 (Hostinger shared hosting):"
info "  Go to Hostinger DNS Manager → change A records to 76.13.96.107"
echo ""
info "To force-renew all certs:"
info "  ./deploy.sh --ssl-renew"
echo ""
