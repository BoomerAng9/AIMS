FROM node:20-slim AS base
RUN npm install -g bun@latest
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install
COPY . .

# Default to core service — override CMD per service in docker-compose
ARG SERVICE=core
ENV SERVICE=${SERVICE}
EXPOSE 4001 4002 4003 4004

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -sf http://127.0.0.1:${PORT:-4001}/health || exit 1

CMD ["bun", "run", "src/index.ts"]
