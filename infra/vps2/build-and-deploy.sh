#!/bin/bash
set -e

echo "=== VPS2 BUILD & DEPLOY ==="

# Ensure required directories
mkdir -p /etc/aims/nginx/plugs
mkdir -p /data/plug-engine

cd /opt/aims-vps2

# Install npm deps and build plug-engine
echo "--- Building plug-engine ---"
cd plug-engine
npm install 2>&1 | tail -5
npx tsc 2>&1
echo "plug-engine built OK"

# Install npm deps and build monitoring
echo "--- Building monitoring ---"
cd ../monitoring
npm install 2>&1 | tail -5
npx tsc 2>&1
echo "monitoring built OK"

# Build docker images
echo "--- Building Docker images ---"
cd /opt/aims-vps2
docker compose -f docker-compose.prod.yml build 2>&1 | tail -20
echo "Docker build complete"

# Start services
echo "--- Starting services ---"
docker compose -f docker-compose.prod.yml up -d 2>&1
echo "Waiting 15s for startup..."
sleep 15

# Show status
echo "=== CONTAINER STATUS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health checks
echo "=== HEALTH CHECKS ==="
wget -q -O- http://10.0.0.2:4200/health 2>/dev/null && echo "" || echo "plug-engine: FAIL"
wget -q -O- http://10.0.0.2:4300/health 2>/dev/null && echo "" || echo "monitoring: FAIL"
wget -q -O- http://localhost/health 2>/dev/null && echo "" || echo "nginx: FAIL"

echo "=== DEPLOY COMPLETE ==="
