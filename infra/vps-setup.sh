#!/usr/bin/env bash
# =============================================================================
# A.I.M.S. VPS Bootstrap Script
# =============================================================================
# Run on a fresh Ubuntu 22.04+ VPS to install all dependencies and prepare
# for deployment. After this script completes, run ./deploy.sh to launch.
#
# Usage:
#   ssh root@your-vps
#   curl -sSL https://raw.githubusercontent.com/BoomerAng9/AIMS/main/infra/vps-setup.sh | bash
#
#   — OR —
#
#   git clone https://github.com/BoomerAng9/AIMS.git
#   cd AIMS
#   chmod +x infra/vps-setup.sh
#   sudo ./infra/vps-setup.sh
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

# Must be root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root (sudo)."
    exit 1
fi

header "A.I.M.S. VPS Setup — AI Managed Solutions"

# ─────────────────────────────────────────────────────────────────────────────
# 1. System updates
# ─────────────────────────────────────────────────────────────────────────────
header "1/7  System Updates"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban \
    unattended-upgrades

info "System packages updated."

# ─────────────────────────────────────────────────────────────────────────────
# 2. Node.js (required for Gemini CLI)
# ─────────────────────────────────────────────────────────────────────────────
header "2/7  Node.js 20 LTS"

if command -v node &> /dev/null; then
    info "Node.js already installed: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
    info "Node.js installed: $(node --version)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. Docker installation
# ─────────────────────────────────────────────────────────────────────────────
header "3/7  Docker Engine"

if command -v docker &> /dev/null; then
    info "Docker already installed: $(docker --version)"
else
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    info "Docker installed: $(docker --version)"
fi

# Ensure Docker Compose plugin
if docker compose version &> /dev/null; then
    info "Docker Compose available: $(docker compose version)"
else
    error "Docker Compose plugin missing. Install manually."
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Firewall (UFW)
# ─────────────────────────────────────────────────────────────────────────────
header "4/7  Firewall Configuration"

ufw --force reset > /dev/null 2>&1
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh        # 22
ufw allow http       # 80  (nginx + Let's Encrypt)
ufw allow https      # 443 (nginx SSL)
ufw --force enable

info "UFW firewall active. Allowed: SSH (22), HTTP (80), HTTPS (443)."

# ─────────────────────────────────────────────────────────────────────────────
# 5. Fail2ban (SSH brute-force protection)
# ─────────────────────────────────────────────────────────────────────────────
header "5/7  Fail2ban"

cat > /etc/fail2ban/jail.local << 'JAIL'
[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 5
bantime  = 3600
findtime = 600
JAIL

systemctl enable fail2ban
systemctl restart fail2ban
info "Fail2ban active — 5 failed SSH attempts = 1h ban."

# ─────────────────────────────────────────────────────────────────────────────
# 6. Deploy user + AI CLIs (Claude Code + Gemini)
# ─────────────────────────────────────────────────────────────────────────────
header "6/7  Deploy User"

DEPLOY_USER="aims"
if id "${DEPLOY_USER}" &>/dev/null; then
    info "User '${DEPLOY_USER}' already exists."
else
    useradd -m -s /bin/bash -G docker "${DEPLOY_USER}"
    info "Created user '${DEPLOY_USER}' with Docker access."
fi

# Ensure aims user can run Docker
usermod -aG docker "${DEPLOY_USER}" 2>/dev/null || true

# Install AI CLIs for the deploy user
info "Installing Claude Code CLI for '${DEPLOY_USER}'..."
su - "${DEPLOY_USER}" -c "npm install -g @anthropic-ai/claude-code 2>/dev/null || true"
info "Claude Code CLI installed. Run with: claude"

info "Installing Gemini CLI for '${DEPLOY_USER}'..."
su - "${DEPLOY_USER}" -c "npm install -g @google/gemini-cli 2>/dev/null || true"
info "Gemini CLI installed. Run with: gemini -y (YOLO mode)"

info "Set ANTHROPIC_API_KEY and GEMINI_API_KEY in the aims user's environment before using."

# ─────────────────────────────────────────────────────────────────────────────
# 7. Swap (for small VPS — 2GB servers)
# ─────────────────────────────────────────────────────────────────────────────
header "7/7  Swap File"

if [ -f /swapfile ]; then
    info "Swap already configured."
else
    TOTAL_RAM_MB=$(free -m | awk '/Mem:/{print $2}')
    if [ "$TOTAL_RAM_MB" -lt 4096 ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile > /dev/null
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        info "2GB swap file created (RAM: ${TOTAL_RAM_MB}MB)."
    else
        info "Sufficient RAM (${TOTAL_RAM_MB}MB). Swap not needed."
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
echo ""
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "${GREEN}  A.I.M.S. VPS Setup Complete${NC}\n"
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo ""
info "Next steps:"
info "  1. Clone the repo (if not already):"
info "       su - aims"
info "       git clone https://github.com/BoomerAng9/AIMS.git"
info "       cd AIMS"
info ""
info "  2. Create your production environment file:"
info "       cp infra/.env.production.example infra/.env.production"
info "       nano infra/.env.production"
info ""
info "  3. Run the deployment script:"
info "       ./deploy.sh --domain your-domain.com --email you@email.com"
info ""
info "  The deploy script will:"
info "    - Build Docker images"
info "    - Issue Let's Encrypt SSL certs"
info "    - Start all services"
info "    - Configure automatic cert renewal"
info ""
info "  4. AI CLIs — available on the VPS:"
info ""
info "     Claude Code:"
info "       su - aims"
info "       export ANTHROPIC_API_KEY=your-key"
info "       cd AIMS && claude"
info ""
info "     Gemini CLI (YOLO mode):"
info "       su - aims"
info "       export GEMINI_API_KEY=your-key"
info "       cd AIMS && gemini -y"
info ""
info "     Both CLIs are great for automated ops, deployments, and debugging."
info "     Gemini YOLO mode (-y) auto-approves all tool calls."
echo ""
