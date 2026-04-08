FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY src/ ./src/
COPY tsconfig.json ./

RUN npx tsc

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache docker-cli wget

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist/

EXPOSE 4400

CMD ["node", "dist/server.js"]
