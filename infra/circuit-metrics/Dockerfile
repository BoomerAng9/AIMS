# Circuit Metrics - Service Health Monitor
FROM node:22-alpine

WORKDIR /app

RUN addgroup -g 1001 metrics && \
    adduser -u 1001 -G metrics -s /bin/sh -D metrics

COPY package.json ./
RUN npm install

COPY . .
RUN npx tsc && npm prune --production && npm cache clean --force

USER metrics

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:9090/health || exit 1

EXPOSE 9090

CMD ["node", "dist/index.js"]
