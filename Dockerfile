# ============================================
# ft_transcendence Production Dockerfile
# Multi-stage build for Fresh/Deno application
# ============================================

# --- Build Stage ---
FROM denoland/deno:alpine-2.1.4 AS builder

WORKDIR /app

# Copy dependency files first (cache layer)
COPY deno.json deno.lock* ./

# Cache dependencies
RUN deno cache deno.json || true

# Copy source code
COPY . .

# Cache all imports and type-check
RUN deno cache main.ts
RUN deno task build || true

# --- Production Stage ---
FROM denoland/deno:alpine-2.1.4

# Install only runtime dependencies
RUN apk add --no-cache sqlite

# Deno user already exists in base image

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=deno:deno /app .

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R deno:deno /app/data

# Environment
ENV DENO_DIR=/deno-dir
ENV DENO_NO_UPDATE_CHECK=1
ENV DENO_NO_PROMPT=1
ENV DENO_ENV=production

USER deno

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

CMD ["deno", "task", "start"]
