# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN apk add --no-cache python3 make g++
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
RUN mkdir -p /app/data/avatars
EXPOSE 3001
CMD ["sh", "-c", "node dist/main.js 2>/dev/null || node dist/src/main.js"]
