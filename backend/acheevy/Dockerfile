FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build

# Run as non-root user for security
RUN addgroup -g 1001 -S acheevy && \
    adduser -S acheevy -u 1001 -G acheevy && \
    chown -R acheevy:acheevy /app
USER acheevy

EXPOSE 3003
CMD ["node", "dist/index.js"]
