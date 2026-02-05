#!/bin/bash
set -e

export PATH="/home/pn/.bun/bin:/app/ii_agent/.venv/bin:$PATH"

# If running as root, use gosu to switch to pn user
if [ "$(id -u)" = "0" ]; then
    echo "Switching to pn user with gosu..."
    exec gosu pn "$@"
else
    echo "Already running as non-root user"
    exec "$@"
fi
