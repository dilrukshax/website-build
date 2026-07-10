# ============================================================
# Unified Dockerfile — Project Aurora Monorepo
# Builds BOTH @project-aurora/website-builder-api (Express) and
# @project-aurora/website-builder-web (Next.js standalone) into one image.
#
# Ports: API → 3002 | CMS → 3001
# Startup: entrypoint.sh (prisma migrate + api + cms)
# ============================================================

# ----------------------------------------------------------
# Stage 0: base — shared Node.js 20 + pnpm + system deps
# ----------------------------------------------------------
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ----------------------------------------------------------
# Stage 1a: prune-api — Turborepo prune for @project-aurora/website-builder-api
# ----------------------------------------------------------
FROM base AS prune-api

COPY . .
RUN npx turbo prune @project-aurora/website-builder-api --docker

# ----------------------------------------------------------
# Stage 1b: prune-cms — Turborepo prune for @project-aurora/website-builder-web
# ----------------------------------------------------------
FROM base AS prune-cms

COPY . .
RUN npx turbo prune @project-aurora/website-builder-web --docker

# ----------------------------------------------------------
# Stage 2a: builder-api — Install deps + build API
# ----------------------------------------------------------
FROM base AS builder-api

# Copy pruned manifests (cached layer)
COPY --from=prune-api /app/out/json/ .
COPY --from=prune-api /app/out/pnpm-lock.yaml  ./pnpm-lock.yaml
COPY --from=prune-api /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install deps
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy pruned source
COPY --from=prune-api /app/out/full/ .

# Ensure Prisma schema exists
COPY --from=prune-api /app/out/full/packages/database/prisma ./packages/database/prisma

# Generate Prisma client
RUN pnpm --filter @project-aurora/database run db:generate

# Copy root configs needed by build
COPY turbo.json tsconfig.json ./

# Build API (and its internal dependencies)
RUN pnpm turbo build --filter=@project-aurora/website-builder-api...

# ----------------------------------------------------------
# Stage 2b: builder-cms — Install deps + build CMS (Next.js)
# ----------------------------------------------------------
FROM base AS builder-cms

# Copy pruned manifests (cached layer)
COPY --from=prune-cms /app/out/json/ .
COPY --from=prune-cms /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prune-cms /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install deps (including devDeps for build)
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy pruned source
COPY --from=prune-cms /app/out/full/ .

# Build args for Next.js (baked at build time)
ARG NEXT_PUBLIC_WEBSITE_BUILDER_API_URL=http://localhost:3002
ARG NEXT_PUBLIC_API_URL=http://localhost:3002
ENV NEXT_PUBLIC_WEBSITE_BUILDER_API_URL=${NEXT_PUBLIC_WEBSITE_BUILDER_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure public dir exists
RUN mkdir -p apps/website-builder-web/public

# Copy root configs needed by build
COPY turbo.json tsconfig.json ./

# Build CMS (and its internal dependencies)
RUN pnpm turbo build --filter=@project-aurora/website-builder-web...

# ----------------------------------------------------------
# Stage 3: runner — minimal final image with both apps
# ----------------------------------------------------------
FROM node:20-alpine AS runner

# Runtime deps for Prisma + compatibility
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# ── API artifacts ─────────────────────────────────────────
# Copy the entire API workspace (preserves pnpm symlinks + Prisma client)
COPY --from=builder-api --chown=appuser:nodejs /app /app

# ── CMS artifacts ─────────────────────────────────────────
# Copy Next.js standalone output on top of the workspace
COPY --from=builder-cms --chown=appuser:nodejs /app/apps/website-builder-web/.next/standalone/apps/website-builder-web ./apps/website-builder-web
COPY --from=builder-cms --chown=appuser:nodejs /app/apps/website-builder-web/.next/standalone/node_modules ./node_modules_cms_standalone
COPY --from=builder-cms --chown=appuser:nodejs /app/apps/website-builder-web/.next/static ./apps/website-builder-web/.next/static
COPY --from=builder-cms --chown=appuser:nodejs /app/apps/website-builder-web/public ./apps/website-builder-web/public

# ── Entrypoint ───────────────────────────────────────────
COPY --chown=appuser:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# ── Environment ──────────────────────────────────────────
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3002
ENV CMS_PORT=3001

USER appuser

EXPOSE 3002 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["./entrypoint.sh"]
