#!/bin/bash
# Description: Automates the NemoClaw setup on the VPS over SSH.
# Pre-requisite: You will be prompted for the root password if an SSH key is not set up.

VPS_IP="31.97.133.29"
VPS_USER="root"

echo "Connecting to VPS ($VPS_USER@$VPS_IP) to install NemoClaw..."

ssh "$VPS_USER@$VPS_IP" << 'EOF'
set -e

echo "1. Downloading NemoClaw script..."
curl -fsSL https://nvidia.com/nemoclaw.sh -o nemoclaw.sh

echo "2. Installing NemoClaw..."
# Note: You should ideally inspect the script first, but proceeding with installation
bash nemoclaw.sh

echo "3. Running NemoClaw onboard migration to discover existing OpenClaw agents..."
nemoclaw onboard

echo "4. Setting up Nemoclaw Gateway as a background service on loopback..."
# We can use pm2, systemd, or nohup. For simplicity, we use nohup for now.
# Realistically, this should be added to Docker Compose or Traefik later.
nohup openclaw gateway --port 18789 --bind 127.0.0.1 --verbose > /var/log/nemoclaw_gateway.log 2>&1 &

echo "NemoClaw has been installed and the gateway is running on 127.0.0.1:18789."
echo "You can check the logs via: tail -f /var/log/nemoclaw_gateway.log"
EOF

echo "Done! To access it, establish an SSH tunnel from another terminal:"
echo "> ssh -L 18789:localhost:18789 root@$VPS_IP"
