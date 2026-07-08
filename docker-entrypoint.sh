#!/bin/sh
# UYCHI MAJLIS backend container entrypoint.
# Applies DB migrations, seeds demo data (idempotent), then starts the server.
# NEVER drops/wipes the database — data is always preserved.
set -e

echo "[entrypoint] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[entrypoint] migrate deploy failed — clearing any failed migration record (data-safe) and retrying..."
  # All migrations are idempotent (IF NOT EXISTS everywhere), so marking a failed/
  # interrupted migration as rolled back and re-applying is safe and never drops data.
  npx prisma migrate resolve --rolled-back 20240102000000_add_totp_sessions 2>/dev/null || true
  npx prisma migrate resolve --rolled-back 20240103000000_add_performance_indexes 2>/dev/null || true
  npx prisma migrate deploy
fi

echo "[entrypoint] Seeding database (idempotent)..."
npx tsx prisma/seed.ts || echo "[entrypoint] Seed skipped/failed (non-fatal), continuing..."

echo "[entrypoint] Starting UYCHI MAJLIS backend..."
exec node dist/index.js
