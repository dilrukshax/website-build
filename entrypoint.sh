#!/bin/sh
# ============================================================
# entrypoint.sh — Start both API and CMS inside one container
# ============================================================
set -e

echo "[startup] === Project Aurora unified container starting ==="

# ─── 1. Prisma Migrations ──────────────────────────────────
echo "[startup] Running Prisma migrations..."
MAX_RETRIES=5
i=1
while [ "$i" -le "$MAX_RETRIES" ]; do
  if (cd /app/packages/database && npx prisma migrate deploy); then
    echo "[startup] Prisma migrations applied successfully."
    break
  fi
  echo "[startup] Migration attempt ${i}/${MAX_RETRIES} failed. Retrying in 5s..."
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "[startup] ERROR: Prisma migrations failed after ${MAX_RETRIES} attempts. Exiting."
    exit 1
  fi
  i=$((i + 1))
  sleep 5
done

# ─── 2. Start API (background) ────────────────────────────
echo "[startup] Starting API on port ${PORT:-3002}..."
cd /app/apps/website-builder-api
node dist/server.js &
API_PID=$!
echo "[startup] API started (PID: ${API_PID})"

# ─── 3. Start CMS (foreground) ────────────────────────────
echo "[startup] Starting CMS on port ${CMS_PORT:-3001}..."
cd /app
PORT=${CMS_PORT:-3001} node apps/website-builder-web/server.js &
CMS_PID=$!
echo "[startup] CMS started (PID: ${CMS_PID})"

# ─── 4. Wait and propagate exit ───────────────────────────
# If either process exits, bring the container down
wait_and_exit() {
  echo "[startup] A process exited. Shutting down container..."
  kill "$API_PID" "$CMS_PID" 2>/dev/null || true
  exit 1
}

trap wait_and_exit TERM INT

# Wait for both; if either exits unexpectedly, shut everything down
wait "$API_PID" && wait "$CMS_PID" || wait_and_exit
