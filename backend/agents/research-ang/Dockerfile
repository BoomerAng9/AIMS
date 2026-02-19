# Research_Ang — Containerized A2A Agent
# Tier 1 Agent: Market research, competitive analysis, data interpretation

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S ang && adduser -u 1001 -S ang -G ang
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
USER ang
EXPOSE 3020
ENV NODE_ENV=production
ENV PORT=3020
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD node -e "require('http').get('http://127.0.0.1:3020/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
CMD ["node", "dist/index.js"]
