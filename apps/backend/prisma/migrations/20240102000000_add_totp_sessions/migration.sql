-- Add TOTP fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_backup_codes" JSONB;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_known_ip" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_known_device" TEXT;

-- Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "ip_address" TEXT,
    "device_info" TEXT,
    "location" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_activity" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions"("token");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "sessions_user_active_idx" ON "sessions"("user_id", "is_active");

-- Create api_keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL UNIQUE,
    "key_prefix" TEXT NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "organization_id" UUID REFERENCES "organizations"("id") ON DELETE SET NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "allowed_ips" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for api_keys
CREATE INDEX IF NOT EXISTS "api_keys_user_id_idx" ON "api_keys"("user_id");
CREATE INDEX IF NOT EXISTS "api_keys_key_prefix_idx" ON "api_keys"("key_prefix");
CREATE INDEX IF NOT EXISTS "api_keys_organization_id_idx" ON "api_keys"("organization_id");

-- Create data_retention_config table
CREATE TABLE IF NOT EXISTS "data_retention_config" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "entity_type" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL DEFAULT 365,
    "action" TEXT NOT NULL DEFAULT 'DELETE',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_cleanup_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "data_retention_config_org_entity_idx"
    ON "data_retention_config"("organization_id", "entity_type");

-- Create app_versions table for mobile update checking
CREATE TABLE IF NOT EXISTS "app_versions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "build_number" INTEGER NOT NULL,
    "min_version" TEXT NOT NULL,
    "min_build_number" INTEGER NOT NULL,
    "update_url" TEXT,
    "release_notes" TEXT,
    "is_force_update" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "published_at" TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_versions_platform_version_idx"
    ON "app_versions"("platform", "version");

-- Create audit_logs_archive table for data retention
CREATE TABLE IF NOT EXISTS "audit_logs_archive" (
    LIKE "audit_logs" INCLUDING ALL
);

-- Add check_in_method column to meeting_participants if not exists
ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "check_in_method" TEXT DEFAULT 'MANUAL';

-- Add fields to employees table
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "reference_photo" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "reference_photo_hash" TEXT;

-- Add language_preference to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language_preference" TEXT NOT NULL DEFAULT 'uz';

-- Add theme_preference to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "theme_preference" TEXT NOT NULL DEFAULT 'system';

-- Add notification log fields
ALTER TABLE "notification_logs" ADD COLUMN IF NOT EXISTS "recipient" TEXT;
ALTER TABLE "notification_logs" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "notification_logs" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "notification_logs" ADD COLUMN IF NOT EXISTS "error" TEXT;
ALTER TABLE "notification_logs" ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMPTZ;
ALTER TABLE "notification_logs" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "notification_logs" ALTER COLUMN "title" DROP NOT NULL;

-- Add EMAIL to notification_channel enum
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'EMAIL';

-- Create messages table
CREATE TABLE IF NOT EXISTS "messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sender_id" UUID NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "receiver_id" UUID NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages"("receiver_id");
CREATE INDEX IF NOT EXISTS "messages_sender_receiver_idx" ON "messages"("sender_id", "receiver_id");

-- Add check_in_method to meeting_participants if not exists
ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "check_in_method" TEXT DEFAULT 'MANUAL';

-- Create function to auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE "sessions" SET "is_active" = false
    WHERE "expires_at" < NOW() AND "is_active" = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    INSERT INTO "audit_logs_archive" SELECT * FROM "audit_logs"
    WHERE "created_at" < NOW() - (retention_days || ' days')::INTERVAL;

    DELETE FROM "audit_logs"
    WHERE "created_at" < NOW() - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
