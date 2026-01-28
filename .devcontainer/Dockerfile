FROM node:22-alpine

# Install development dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    sqlite

# Set up workspace
WORKDIR /workspace

# Set node user
USER node
