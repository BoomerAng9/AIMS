FROM oven/bun:1-alpine
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY src/ src/

# Run as non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 5003
CMD ["bun", "run", "src/server.ts"]
