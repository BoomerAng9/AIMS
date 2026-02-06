# OpenClaw Sandbox Image v2026.2.3
# Isolated execution environment for agent tool calls
#
# This image is used by OpenClaw to execute tools in a sandboxed environment.
# It contains common utilities but runs with restricted permissions.
#
# Compatible with OpenClaw v2026.2.3 (Node.js 24+ required)

FROM node:24-bookworm-slim

LABEL maintainer="A.I.M.S. Team"
LABEL description="OpenClaw sandbox for isolated tool execution"
LABEL openclaw.version="2026.2.3"

# Install essential tools for agent operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    git \
    jq \
    unzip \
    python3 \
    python3-pip \
    python3-venv \
    ripgrep \
    fd-find \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install common npm tools for agent use
RUN npm install -g \
    typescript@5.7 \
    tsx \
    pnpm@9 \
    && npm cache clean --force

# Create sandbox user (non-root)
RUN groupadd -g 1000 sandbox && \
    useradd -u 1000 -g sandbox -m -s /bin/bash sandbox

# Create workspace directories
RUN mkdir -p /workspace /home/sandbox/.cache && \
    chown -R sandbox:sandbox /workspace /home/sandbox

# Security: Remove dangerous commands
RUN rm -f /usr/bin/su /usr/bin/sudo /usr/bin/chroot 2>/dev/null || true

# Security: Restrict network tools
RUN rm -f /usr/bin/nc /usr/bin/netcat /usr/bin/ncat 2>/dev/null || true

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER sandbox

# Environment for sandbox
ENV HOME=/home/sandbox
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Healthcheck for sandbox readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=2 \
    CMD node --version || exit 1

# Default command
CMD ["bash"]
