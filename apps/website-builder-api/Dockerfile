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
# Stage 1: Prune — keep only packages needed by @project-aurora/website-builder-api
# ----------------------------------------------------------
FROM base AS pruner

COPY . .

# Fail fast with actionable guidance if the Docker build context is not the repo root.
RUN test -f package.json && test -f pnpm-workspace.yaml && test -f turbo.json || \
    (echo "[build-error] Monorepo root files are missing in Docker context." && \
     echo "[build-error] Set Dockerfile path to apps/website-builder-api/Dockerfile and Docker context to ." && \
     exit 1)

RUN node -e "const pkg=require('./package.json'); if(!pkg.packageManager){console.error('[build-error] Root package.json is missing packageManager (expected pnpm@10.30.3).'); process.exit(1);}"

RUN npx turbo prune @project-aurora/website-builder-api --docker

# ----------------------------------------------------------
# Stage 2: Installer / Builder
# ----------------------------------------------------------
FROM base AS installer

# Stabilize constrained CI builders (Coolify) to reduce abrupt build kills.
ENV NODE_OPTIONS="--max-old-space-size=1536"

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
RUN pnpm --filter @project-aurora/database run db:generate

# Copy root config files if needed by build
COPY turbo.json tsconfig.json ./

# Build API and its internal dependencies
RUN pnpm turbo build --filter=@project-aurora/website-builder-api... --concurrency=1

# ----------------------------------------------------------
# Stage 3: Runner — minimal production image
# ----------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Runtime deps for Prisma + compatibility
# curl is required so platform health checks (Coolify/Sevalla) can probe the container.
RUN apk add --no-cache libc6-compat openssl curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

ENV NODE_ENV=production

# Copy the entire workspace from installer to preserve perfectly intact pnpm symlinks
COPY --from=installer --chown=apiuser:nodejs /app /app

USER apiuser

# Metadata only — app must still listen on process.env.PORT in code
EXPOSE 5074
WORKDIR /app/apps/website-builder-api

# IMPORTANT:
# Keep Docker HEALTHCHECK out for now.
# Configure health checks in Sevalla instead:
#   Path: /health
#   Port: 5074
#
# If your compiled entry file is main.js instead of server.js,
# change the line below accordingly.
CMD ["sh", "-c", "cd /app/packages/database && for i in 1 2 3 4 5; do npx prisma migrate deploy && break; echo \"[startup] prisma migrate deploy failed (attempt ${i}/5), retrying in 5s...\"; if [ \"${i}\" -eq 5 ]; then echo \"[startup] prisma migrate deploy failed after 5 attempts\"; exit 1; fi; sleep 5; done && cd /app/apps/website-builder-api && node dist/server.js"]
