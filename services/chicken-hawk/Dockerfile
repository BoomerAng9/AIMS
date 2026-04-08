FROM node:20-slim AS base
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun@latest
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install
COPY . .

# Run as non-root user for security
RUN groupadd -g 1001 appuser && \
    useradd -u 1001 -g appuser -s /bin/sh appuser && \
    chown -R appuser:appuser /app
USER appuser

# Default to core service — override CMD per service in docker-compose
ARG SERVICE=core
ENV SERVICE=${SERVICE}
EXPOSE 4001 4002 4003 4004

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -sf http://127.0.0.1:${PORT:-4001}/health || exit 1

CMD ["bun", "run", "src/index.ts"]
