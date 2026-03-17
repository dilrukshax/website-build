# ============================================================
# API Dockerfile — Multi-stage build with Turborepo pruning
# ============================================================
# Optimizations:
#   - Turborepo prune: only copies packages needed by @booking-engine/api
#   - pnpm fetch: caches dependencies by lockfile hash
#   - Multi-stage: install → build → runtime (minimal final image)
#   - Non-root user for security
#   - Alpine base for minimal image size (~120MB final)
# ============================================================

# ----------------------------------------------------------
# Stage 0: Base — shared Node.js + pnpm setup
# ----------------------------------------------------------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
RUN apk add --no-cache libc6-compat

# ----------------------------------------------------------
# Stage 1: Prune — use Turborepo to extract only what API needs
# ----------------------------------------------------------
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune @booking-engine/api --docker

# ----------------------------------------------------------
# Stage 2: Install — install dependencies from pruned lockfile
# ----------------------------------------------------------
FROM base AS installer
WORKDIR /app

# Copy pruned package manifests (for dependency cache layer)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install dependencies (cached unless lockfile changes)
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Copy Prisma schema for generation
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma

# Generate Prisma client
RUN pnpm --filter @booking-engine/database run db:generate

# Copy root config files missing from out/full
COPY turbo.json tsconfig.json ./

# Build all packages in dependency order via Turborepo
RUN pnpm turbo build --filter=@booking-engine/api...

# ----------------------------------------------------------
# Stage 3: Runner — minimal production image
# ----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=installer --chown=apiuser:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=installer --chown=apiuser:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=installer --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=apiuser:nodejs /app/packages ./packages
COPY --from=installer --chown=apiuser:nodejs /app/package.json ./package.json
COPY --from=installer --chown=apiuser:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy Prisma schema + migrations for runtime migrate
COPY --from=installer --chown=apiuser:nodejs /app/packages/database/prisma ./packages/database/prisma

USER apiuser

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
