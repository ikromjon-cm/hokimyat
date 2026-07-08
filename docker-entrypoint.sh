#!/bin/sh
# UYCHI MAJLIS backend container entrypoint.
# Applies DB migrations, seeds demo data (idempotent), then starts the server.
set -e

echo "[entrypoint] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[entrypoint] 'migrate deploy' failed (likely a failed/dirty migration record, e.g. P3009)."
  if [ "$OTP_DEMO_MODE" = "true" ] || [ "$DB_RESET_ON_FAILED_MIGRATION" = "true" ]; then
    echo "[entrypoint] Demo mode: resetting the database to recover a clean migration state (THIS WIPES DATA)..."
    npx prisma migrate reset --force --skip-seed
  else
    echo "[entrypoint] Not demo mode — refusing to auto-reset. Resolve manually: https://pris.ly/d/migrate-resolve"
    exit 1
  fi
fi

echo "[entrypoint] Seeding database (idempotent)..."
npx tsx prisma/seed.ts || echo "[entrypoint] Seed skipped/failed (non-fatal), continuing..."

echo "[entrypoint] Starting UYCHI MAJLIS backend..."
exec node dist/index.js
