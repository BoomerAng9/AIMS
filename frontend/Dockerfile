# =============================================================================
# A.I.M.S. Frontend — Production Dockerfile
# =============================================================================
# Multi-stage build for Next.js 14 with standalone output.
# Standalone mode produces a self-contained server (~150MB vs ~500MB).

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

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

EXPOSE 3000

USER node
CMD ["node", "server.js"]
