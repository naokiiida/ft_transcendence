FROM node:22-alpine

# Install development dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    sqlite

# Set up workspace
WORKDIR /workspace

# Install pnpm for faster package management (optional)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set node user
USER node
