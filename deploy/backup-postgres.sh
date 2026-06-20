#!/usr/bin/env bash
# Backup Postgres database from production Docker stack
# Usage: bash deploy/backup-postgres.sh [output-dir]
# Cron example: 0 3 * * * cd /path/to/repo && bash deploy/backup-postgres.sh /var/backups/wifi-saas

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT_DIR="${1:-$ROOT/backups}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE="docker compose -f docker-compose.prod.yml"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$OUT_DIR/sub_based_internet-$STAMP.sql"

mkdir -p "$OUT_DIR"

echo "Backing up to $FILE ..."
$COMPOSE --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-sub_based_internet}" > "$FILE"

gzip -f "$FILE"
echo "Done: ${FILE}.gz"

# Prune backups older than 30 days
find "$OUT_DIR" -name 'sub_based_internet-*.sql.gz' -mtime +30 -delete 2>/dev/null || true
