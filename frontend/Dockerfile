# =============================================================================
# A.I.M.S. Frontend — Production Dockerfile
# =============================================================================
# Multi-stage build for Next.js 14 with standalone output.

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time env vars (safe to embed, no secrets)
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# Production image — minimal footprint
# ---------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Copy only what's needed for production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

USER node
CMD ["npm", "start"]
