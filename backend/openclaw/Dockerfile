# OpenClaw Dockerfile for A.I.M.S.
# Based on Node 22 (required by OpenClaw)

FROM node:22-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++ git

WORKDIR /app

# Install OpenClaw globally
RUN npm install -g openclaw@latest pnpm

# Create workspace directory
RUN mkdir -p /app/workspace /app/config

# Copy configuration files
COPY config/ /app/config/
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose Gateway port
EXPOSE 18789

# Set environment variables
ENV NODE_ENV=production
ENV OPENCLAW_WORKSPACE=/app/workspace
ENV OPENCLAW_CONFIG=/app/config/openclaw.toml

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:18789/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
