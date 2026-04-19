# Operations Floor Compositor -- Cloud Run image
# ================================================
# Node 20 + Chromium (for Remotion headless render) + FFmpeg (for
# encoding). Runs the Express /compose endpoint which programmatically
# composes Cosmos environment + Seedance character clips into a final
# MP4 and uploads to GCS.
#
# Base: Node 20 Debian slim -- compatible with Remotion's Chromium
# dependency and keeps the image reasonable.

FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NODE_ENV=production

# Chromium + FFmpeg + fonts Remotion uses for text rendering.
RUN apt-get update && apt-get install -y --no-install-recommends \
        chromium \
        ffmpeg \
        fonts-liberation \
        fonts-noto-color-emoji \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libnss3 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        ca-certificates \
        wget \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    REMOTION_CHROMIUM_HEADLESS=1

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript ahead of serve
RUN npm install --save-dev typescript @types/express @types/node \
    @types/react @types/react-dom \
    && npx tsc \
    && npm prune --omit=dev

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
