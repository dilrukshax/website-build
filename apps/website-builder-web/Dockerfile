# ============================================================
# CMS Dockerfile — Coolify-ready monorepo build
# Next.js standalone + Turborepo prune for small runtime image
# ============================================================
# Coolify settings:
#   - Dockerfile path: apps/website-builder-web/Dockerfile
#   - Build context: .
# ============================================================

# ----------------------------------------------------------
# Stage 0: Base runtime with pnpm
# ----------------------------------------------------------
FROM node:20-alpine AS base
RUN set -eux; \
    apk add --no-cache libc6-compat; \
    corepack enable; \
    attempts=0; \
    until corepack prepare pnpm@10.30.3 --activate; do \
      attempts=$((attempts + 1)); \
      if [ "$attempts" -ge 3 ]; then \
        echo "[build-warn] corepack prepare failed after ${attempts} attempts; falling back to npm install -g pnpm@10.30.3"; \
        npm install -g pnpm@10.30.3; \
        break; \
      fi; \
      echo "[build-warn] corepack prepare failed (attempt ${attempts}), retrying..."; \
      sleep $((attempts * 3)); \
    done; \
    pnpm --version

# ----------------------------------------------------------
# Stage 1: Prune monorepo to CMS dependency graph
# ----------------------------------------------------------
FROM base AS pruner
WORKDIR /app
COPY . .

# Fail fast if Coolify build context is not set to repository root.
RUN test -f package.json && test -f pnpm-workspace.yaml && test -f turbo.json || \
    (echo "[build-error] Monorepo root files are missing in Docker context." && \
     echo "[build-error] In Coolify use Dockerfile path apps/website-builder-web/Dockerfile and Build Context ." && \
     exit 1)

RUN node -e "const pkg=require('./package.json'); if(pkg.packageManager!=='pnpm@10.30.3'){console.error('[build-error] Root packageManager must be pnpm@10.30.3 for reproducible builds.'); process.exit(1);}"
RUN npx turbo prune @project-aurora/website-builder-web --docker

# ----------------------------------------------------------
# Stage 2: Install and build
# ----------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Keep memory usage stable on smaller CI builders.
ARG NODE_MAX_OLD_SPACE_SIZE=1024
ENV NODE_OPTIONS="--max-old-space-size=${NODE_MAX_OLD_SPACE_SIZE}"
ENV NEXT_DISABLE_SWC_WORKER=1
ENV NEXT_TELEMETRY_DISABLED=1

# Copy pruned manifests first for better layer caching.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile --prefer-offline

# Copy pruned sources and build only CMS + deps.
COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_WEBSITE_BUILDER_API_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEBSITE_BUILDER_API_URL=${NEXT_PUBLIC_WEBSITE_BUILDER_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN mkdir -p apps/website-builder-web/public
RUN pnpm turbo build --filter=@project-aurora/website-builder-web... --concurrency=1

# ----------------------------------------------------------
# Stage 3: Production runner
# ----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=5073

COPY --from=builder --chown=nextjs:nodejs /app/apps/website-builder-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/website-builder-web/.next/static ./apps/website-builder-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/website-builder-web/public ./apps/website-builder-web/public

USER nextjs

EXPOSE 5073

# Healthcheck removed to prevent Coolify IPv6/localhost resolution issues

CMD ["node", "apps/website-builder-web/server.js"]
