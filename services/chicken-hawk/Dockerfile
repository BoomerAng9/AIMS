FROM node:20-slim AS base
RUN npm install -g bun@latest
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install
COPY . .
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -sf http://127.0.0.1:8081/health || exit 1
CMD ["bun", "run", "src/index.ts"]
