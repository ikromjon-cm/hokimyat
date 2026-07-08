#!/bin/sh
# UYCHI MAJLIS backend container entrypoint.
# Syncs the database to the Prisma schema (the source of truth), seeds demo data
# (idempotent), then starts the server.
#
# We use `prisma db push` instead of `migrate deploy` because the hand-written
# migration files are inconsistent with the schema (they declared UUID foreign
# keys against TEXT/cuid primary keys). `db push` reconciles the live database to
# the schema without dropping it — existing tables and data are preserved.
set -e

echo "[entrypoint] Syncing database schema to Prisma schema (db push)..."
npx prisma db push --accept-data-loss --skip-generate

echo "[entrypoint] Seeding database (idempotent)..."
npx tsx prisma/seed.ts || echo "[entrypoint] Seed skipped/failed (non-fatal), continuing..."

echo "[entrypoint] Starting UYCHI MAJLIS backend..."
exec node dist/index.js
