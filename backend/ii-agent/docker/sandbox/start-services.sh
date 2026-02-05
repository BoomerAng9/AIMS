#!/bin/bash

# If running as root, use gosu to re-execute as pn user
if [ "$(id -u)" = "0" ]; then
    echo "Running as root, switching to pn user with gosu..."
    exec gosu pn bash "$0" "$@"
fi

# Set up environment
export HOME=/home/pn
export PATH="/home/pn/.bun/bin:/app/ii_agent/.venv/bin:$PATH"


# Create workspace directory if it doesn't exist
mkdir -p /workspace
cd /workspace

# Start the sandbox server in the background
echo "Starting sandbox server..."
tmux new-session -d -s sandbox-server-system-never-kill -c /workspace 'WORKSPACE_DIR=/workspace xvfb-run python -m ii_tool.mcp.server'

# Start code-server in the background
echo "Starting code-server on port 9000..."
tmux new-session -d -s code-server-system-never-kill -c /workspace 'code-server \
  --port 9000 \
  --auth none \
  --bind-addr 0.0.0.0:9000 \
  --disable-telemetry \
  --disable-update-check \
  --trusted-origins * \
  --disable-workspace-trust \
  /workspace'

# Wait for both processes to start
sleep 3

# Check if processes are running
echo "Checking if services are running..."
if pgrep -f "mcp.server" >/dev/null; then
  echo "✓ Sandbox server is running"
else
  echo "✗ Sandbox server failed to start"
fi

if pgrep -f "code-server" >/dev/null; then
  echo "✓ Code-server is running"
else
  echo "✗ Code-server failed to start"
fi

echo "Services started. Container ready."
echo "Sandbox server available"
echo "Code-server available on port 9000"

# Keep the container running by waiting for all background processes
wait
