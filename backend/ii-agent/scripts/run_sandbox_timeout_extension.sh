#!/bin/bash

# Script to run the sandbox timeout extension cron job
# Processes all permanent sessions with sandboxes.

# Set up the environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Log file location
LOG_DIR="$PROJECT_ROOT/logs/cron"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Add timestamp to log
echo "========================================"
echo "Starting sandbox timeout extension job at $(date)"

# Change to project root
cd "$PROJECT_ROOT"

# Source start_backend.sh for environment variables
if [ -f "start_backend.sh" ]; then
  source start_backend.sh
  echo "Loaded environment from start_backend.sh"
fi

# Load environment variables if .env file exists
if [ -f ".env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs)
fi

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

# Build the Python command with any passthrough arguments
PYTHON_CMD=(python -m src.ii_agent.cron.extend_sandbox_timeout "$@")

echo "Processing permanent sessions"

# Run the Python script
"${PYTHON_CMD[@]}"

# Capture the exit code
EXIT_CODE=$?

# Log completion
if [ $EXIT_CODE -eq 0 ]; then
  echo "Job completed successfully at $(date)"
else
  echo "Job failed with exit code $EXIT_CODE at $(date)"
fi

echo "========================================"

exit $EXIT_CODE
