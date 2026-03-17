# ============================================================
# CMS Dockerfile — Multi-stage Next.js standalone build
# ============================================================
# Optimizations:
#   - Turborepo prune: only copies packages needed by @booking-engine/cms
#   - Next.js standalone output: ~85% smaller than full node_modules
#   - Sharp for optimized image processing in production
#   - Multi-stage: prune → install → build → runtime (~150MB final)
#   - Non-root user for security
# ============================================================

# ----------------------------------------------------------
# Stage 0: Base — shared Node.js + pnpm setup
# ----------------------------------------------------------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
RUN apk add --no-cache libc6-compat

# ----------------------------------------------------------
# Stage 1: Prune — extract only what CMS needs
# ----------------------------------------------------------
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune @booking-engine/cms --docker

# ----------------------------------------------------------
# Stage 2: Install & Build
# ----------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy pruned package manifests (cached layer)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy pruned source
COPY --from=pruner /app/out/full/ .

# Build arguments for Next.js (baked at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure public directory exists (may be empty)
RUN mkdir -p apps/cms/public

# Generate Prisma Client explicitly
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma
RUN pnpm --filter @booking-engine/database run db:generate

# Build all packages in dependency order, then CMS
RUN pnpm turbo build --filter=@booking-engine/cms...

# ----------------------------------------------------------
# Stage 3: Runner — minimal production image
# ----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3001

# Copy standalone output (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/static ./apps/cms/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/public ./apps/cms/public

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001 || exit 1

CMD ["node", "apps/cms/server.js"]
