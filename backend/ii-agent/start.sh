#!/bin/sh
set -e

echo "Starting Xvfb virtual framebuffer..."

Xvfb :99 -screen 0 1280x720x16 &

export DISPLAY=:99

echo "Xvfb started. Display is set to $DISPLAY. Starting application..."

exec python ws_server.py

