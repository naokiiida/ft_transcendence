FROM node:22-alpine

# Install development dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    sqlite

# Set up workspace with proper permissions
WORKDIR /workspace
RUN chown -R node:node /workspace

# Set node user
USER node
