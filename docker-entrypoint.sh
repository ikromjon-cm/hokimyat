#!/bin/sh
# UYCHI MAJLIS backend container entrypoint.
# Applies DB migrations, seeds demo data (idempotent), then starts the server.
set -e

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Seeding database (idempotent)..."
npx tsx prisma/seed.ts || echo "[entrypoint] Seed skipped/failed (non-fatal), continuing..."

echo "[entrypoint] Starting UYCHI MAJLIS backend..."
exec node dist/index.js
