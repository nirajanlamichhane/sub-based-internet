#!/usr/bin/env bash
# Restore Postgres from a backup file
# Usage: bash deploy/restore-postgres.sh path/to/backup.sql.gz

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: bash deploy/restore-postgres.sh <backup.sql.gz>"
  exit 1
fi

BACKUP="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
COMPOSE="docker compose -f docker-compose.prod.yml"

if [[ ! -f "$BACKUP" ]]; then
  echo "File not found: $BACKUP"
  exit 1
fi

echo "WARNING: This will overwrite the current database."
read -r -p "Type 'restore' to continue: " confirm
[[ "$confirm" == "restore" ]] || exit 1

TMP=$(mktemp)
if [[ "$BACKUP" == *.gz ]]; then
  gunzip -c "$BACKUP" > "$TMP"
else
  cp "$BACKUP" "$TMP"
fi

$COMPOSE --env-file "$ENV_FILE" exec -T postgres \
  psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-sub_based_internet}" < "$TMP"

rm -f "$TMP"
echo "Restore complete."
