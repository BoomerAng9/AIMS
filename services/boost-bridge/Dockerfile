FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --production
COPY src/ src/
EXPOSE 7001
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:7001/health || exit 1
CMD ["bun", "run", "src/server.ts"]
