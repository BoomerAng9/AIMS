#!/bin/bash
set -e
echo "=== VPS2 CLEANUP ==="

# Stop any running containers
RUNNING=$(docker ps -q 2>/dev/null)
if [ -n "$RUNNING" ]; then
  echo "Stopping running containers..."
  docker stop $RUNNING
fi

# Remove all containers
ALL=$(docker ps -aq 2>/dev/null)
if [ -n "$ALL" ]; then
  echo "Removing all containers..."
  docker rm -f $ALL
else
  echo "No containers to remove."
fi

# Clean up unused images, volumes, networks
echo "Pruning unused Docker resources..."
docker system prune -af --volumes 2>/dev/null || true

echo "=== AFTER CLEANUP ==="
echo "Containers:"; docker ps -a
echo "Disk:"; df -h /
echo "Memory:"; free -h
echo "=== CLEANUP COMPLETE ==="
