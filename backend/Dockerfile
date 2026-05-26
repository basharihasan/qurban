# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files first (Docker layer cache)
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev && npm cache clean --force

# ─── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN apk add --no-cache dumb-init

WORKDIR /app

# Create uploads directory structure (will be populated at runtime)
RUN mkdir -p uploads/proofs uploads/imports uploads/animals

# Copy node_modules from base stage
COPY --from=base /app/node_modules ./node_modules

# Copy source code
COPY . .

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S qurban -u 1001 && \
    chown -R qurban:nodejs /app

USER qurban

# Expose port (Render sets PORT env var)
EXPOSE 5000

# Health check — Render also does its own HTTP health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/api/health || exit 1

# Use dumb-init to handle signals properly
# start:prod runs migrations then starts the server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod"]
