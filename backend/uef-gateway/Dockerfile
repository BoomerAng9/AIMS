# =============================================================================
# A.I.M.S. UEF Gateway — Production Dockerfile
# =============================================================================
# Multi-stage build. better-sqlite3 requires native compilation (python3, make, g++).

FROM node:20-alpine AS builder

# Install native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Production image — minimal footprint
# ---------------------------------------------------------------------------
FROM node:20-alpine

# better-sqlite3 needs the C++ runtime
RUN apk add --no-cache libstdc++

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci --omit=dev && \
    apk del python3 make g++

COPY --from=builder /app/dist ./dist

# Data directory for SQLite (Pillar 4)
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
EXPOSE 3001

USER node
CMD ["node", "dist/index.js"]
