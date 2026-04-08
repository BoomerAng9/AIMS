#!/bin/bash
set -euo pipefail

# =============================================================
# A.I.M.S. VPS2 Deploy Script
# Target: srv1318308.hstgr.cloud / 31.97.138.45
# Role:   Sandbox & Plug Engine
# =============================================================

VPS2_HOST="31.97.138.45"
VPS2_USER="root"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_aims}"
REMOTE_DIR="/opt/aims-vps2"

log() { echo "[deploy-vps2] $(date '+%H:%M:%S') $1"; }

# ─── Pre-flight Checks ──────────────────────────
log "Pre-flight checks..."

if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 "$VPS2_USER@$VPS2_HOST" "echo ok" >/dev/null 2>&1; then
    echo "ERROR: Cannot SSH into VPS2 ($VPS2_HOST)"
    exit 1
fi

# Verify WireGuard
if ! ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" "ping -c 1 -W 2 10.0.0.1" >/dev/null 2>&1; then
    echo "ERROR: WireGuard tunnel not active — cannot reach VPS1 (10.0.0.1)"
    exit 1
fi
log "WireGuard tunnel ✓"

# ─── Sync Files ──────────────────────────────────
log "Syncing project files to VPS2..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

rsync -avz --delete \
    -e "ssh -i $SSH_KEY" \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    "$SCRIPT_DIR/" \
    "$VPS2_USER@$VPS2_HOST:$REMOTE_DIR/"

# ─── Prepare Directories ────────────────────────
log "Preparing directories..."
ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" "
    mkdir -p /etc/aims/nginx/plugs
    mkdir -p /data/plug-engine
    mkdir -p $REMOTE_DIR
"

# ─── Open Firewall Ports ────────────────────────
log "Configuring firewall..."
ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" '
    ufw allow 80/tcp comment "HTTP" 2>/dev/null || true
    ufw allow 443/tcp comment "HTTPS" 2>/dev/null || true
    ufw allow 51820/udp comment "WireGuard" 2>/dev/null || true
    ufw allow from 10.0.0.1 comment "VPS1 WireGuard" 2>/dev/null || true
    # Allow plug port range
    ufw allow 51000:51999/tcp comment "Plug instances" 2>/dev/null || true
    echo "UFW configured"
'

# ─── Build & Deploy ─────────────────────────────
log "Building and deploying services..."
ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" "
    cd $REMOTE_DIR
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d
    echo 'Waiting for services to start...'
    sleep 10
    docker compose -f docker-compose.prod.yml ps
"

# ─── Health Verification ────────────────────────
log "Verifying services..."
HEALTH_OK=true

# Check plug-engine
if ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" "wget -q -O- http://10.0.0.2:4200/health 2>/dev/null" | grep -q '"ok"'; then
    log "  plug-engine ✓"
else
    log "  plug-engine ✗"
    HEALTH_OK=false
fi

# Check monitoring
if ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" "wget -q -O- http://10.0.0.2:4300/health 2>/dev/null" | grep -q '"ok"'; then
    log "  monitoring ✓"
else
    log "  monitoring ✗"
    HEALTH_OK=false
fi

# Check nginx
if ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" "wget -q -O- http://localhost/health 2>/dev/null" | grep -q '"ok"'; then
    log "  nginx ✓"
else
    log "  nginx ✗"
    HEALTH_OK=false
fi

if [ "$HEALTH_OK" = true ]; then
    log "═══════════════════════════════════════════"
    log "VPS2 DEPLOYMENT COMPLETE ✓"
    log "  Plug Engine:  http://10.0.0.2:4200"
    log "  Monitoring:   http://10.0.0.2:4300"
    log "  nginx:        http://31.97.138.45"
    log "═══════════════════════════════════════════"
else
    log "WARNING: Some services failed health checks"
    ssh -i "$SSH_KEY" "$VPS2_USER@$VPS2_HOST" "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml logs --tail=20"
    exit 1
fi
