# ============================================================
# API Dockerfile — Multi-stage build with Turborepo pruning
# ============================================================

# ----------------------------------------------------------
# Stage 0: Base — shared Node.js + pnpm + system deps
# ----------------------------------------------------------
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ----------------------------------------------------------
# Stage 1: Prune — keep only packages needed by @booking-engine/api
# ----------------------------------------------------------
FROM base AS pruner

COPY . .
RUN npx turbo prune @booking-engine/api --docker

# ----------------------------------------------------------
# Stage 2: Installer / Builder
# ----------------------------------------------------------
FROM base AS installer

# Copy pruned manifests first for better layer caching
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy pruned source
COPY --from=pruner /app/out/full/ .

# Ensure Prisma schema exists where generate expects it
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma

# Generate Prisma client
RUN pnpm --filter @booking-engine/database run db:generate

# Copy root config files if needed by build
COPY turbo.json tsconfig.json ./

# Build API and its internal dependencies
RUN pnpm turbo build --filter=@booking-engine/api...

# ----------------------------------------------------------
# Stage 3: Runner — minimal production image
# ----------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Runtime deps for Prisma + compatibility
RUN apk add --no-cache libc6-compat openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

ENV NODE_ENV=production

# Copy the entire workspace from installer to preserve perfectly intact pnpm symlinks
COPY --from=installer --chown=apiuser:nodejs /app /app

USER apiuser

# Metadata only — app must still listen on process.env.PORT in code
EXPOSE 8081
WORKDIR /app/apps/api

# IMPORTANT:
# Keep Docker HEALTHCHECK out for now.
# Configure health checks in Sevalla instead:
#   Path: /health
#   Port: 8081
#
# If your compiled entry file is main.js instead of server.js,
# change the line below accordingly.
CMD ["sh", "-c", "cd /app/packages/database && for i in 1 2 3 4 5; do npx prisma migrate deploy && break; echo \"[startup] prisma migrate deploy failed (attempt ${i}/5), retrying in 5s...\"; if [ \"${i}\" -eq 5 ]; then echo \"[startup] prisma migrate deploy failed after 5 attempts\"; exit 1; fi; sleep 5; done && cd /app/apps/api && node dist/server.js"]
