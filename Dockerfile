# ============================================================
# AIGP Work Plan Portal - Multi-stage Production Dockerfile
# ============================================================

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY client/ ./client/
COPY shared/ ./shared/
COPY tsconfig.json tsconfig.node.json vite.config.ts components.json ./
COPY patches/ ./patches/
RUN pnpm build:client

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY server/ ./server/
COPY shared/ ./shared/
COPY tsconfig.json tsconfig.server.json ./
RUN npx tsc -p tsconfig.server.json

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

# Copy built frontend (Vite outputs to dist/public by default)
COPY --from=frontend-builder /app/dist/public ./dist/public

# Copy built backend (tsc outputs to dist/server/)
COPY --from=backend-builder /app/dist/server ./dist/server

# Copy migrations (needed at runtime for auto-migration)
COPY server/db/migrations ./dist/server/server/db/migrations

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 4000

# Environment defaults
ENV NODE_ENV=production \
    PORT=4000 \
    RUN_MIGRATIONS_ON_STARTUP=true

# Start server - path matches tsconfig.server.json outDir + rootDir structure
CMD ["node", "dist/server/server/index.js"]
