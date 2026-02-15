# =============================================================================
# A.I.M.S. Frontend — Production Dockerfile
# =============================================================================
# Multi-stage build for Next.js 14 with standalone output.
# Build context is the REPO ROOT (..) so we can access aims-tools/.
# Standalone mode produces a self-contained server (~150MB vs ~500MB).

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from frontend/ subdirectory
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Copy aims-tools to /aims-tools so ../aims-tools resolves from /app
COPY aims-tools/ /aims-tools/

# Build-time env vars (safe to embed, no secrets)
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# Production image — minimal footprint (standalone output)
# ---------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone server + static assets + public dir
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Seed LUC data (Docker named volume will copy on first mount)
COPY --from=builder /app/.luc-data ./.luc-data
RUN chown -R node:node ./.luc-data

EXPOSE 3000

USER node
CMD ["node", "server.js"]
