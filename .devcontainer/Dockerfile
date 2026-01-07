FROM denoland/deno:alpine-2.1.4

# Install development dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    sqlite \
    openssl

# Deno user already exists in base image, just ensure bash shell
RUN sed -i 's|/bin/sh|/bin/bash|' /etc/passwd

# Set up Deno cache directory
ENV DENO_DIR=/deno-dir
ENV DENO_NO_UPDATE_CHECK=1
RUN mkdir -p $DENO_DIR && chown -R deno:deno $DENO_DIR

# Set up workspace
WORKDIR /workspace
RUN chown -R deno:deno /workspace

USER deno

# Pre-cache common Fresh/Preact dependencies (speeds up first run)
RUN deno cache --reload https://deno.land/x/fresh@1.7.3/server.ts || true
