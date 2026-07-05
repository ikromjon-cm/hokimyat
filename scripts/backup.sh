#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=${BACKUP_DIR:-./backups/postgres}
DB_NAME=${DB_NAME:-uychi_majlis}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
RETENTION_DAYS=${RETENTION_DAYS:-7}
S3_BUCKET=${S3_BUCKET:-""}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

notify() {
  local status=$1
  local message=$2
  log "$status: $message"
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST -H "Content-type: application/json" \
      --data "{\"text\":\"[$status] $message\"}" \
      "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
  fi
}

cleanup_old() {
  log "Cleaning up backups older than $RETENTION_DAYS days..."
  find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete
}

upload_to_s3() {
  if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3: $S3_BUCKET..."
    aws s3 cp "$COMPRESSED_FILE" "s3://$S3_BUCKET/backups/postgres/$(basename $COMPRESSED_FILE)" || \
      notify "WARNING" "S3 upload failed"
  fi
}

log "Starting PostgreSQL backup..."
log "Database: $DB_NAME, Host: $DB_HOST:$DB_PORT"

PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=custom \
  --verbose \
  --file="$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
  FILESIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "unknown")
  notify "SUCCESS" "Backup completed: $(basename $BACKUP_FILE) (${FILESIZE} bytes)"
  cleanup_old
  upload_to_s3
else
  notify "ERROR" "Backup failed for $DB_NAME"
  rm -f "$BACKUP_FILE"
  exit 1
fi

log "Backup completed successfully: $BACKUP_FILE"
