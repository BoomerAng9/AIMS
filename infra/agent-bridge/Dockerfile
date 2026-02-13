# Agent Bridge - Security Gateway
# Bridges AIMS network and sandboxed agents with strict security controls
# Bridges AIMS core and sandbox networks

FROM node:24-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev for TypeScript build)
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Copy source and build
COPY . .
RUN npx tsc

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Security: Switch to non-root user
USER node

# Environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3010/health || exit 1

EXPOSE 3010

CMD ["node", "dist/index.js"]
