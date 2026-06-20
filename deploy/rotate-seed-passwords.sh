#!/usr/bin/env bash
# Rotate default seed user passwords after first deploy
# Usage: bash deploy/rotate-seed-passwords.sh NEW_OWNER_PASSWORD NEW_ADMIN_PASSWORD

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: bash deploy/rotate-seed-passwords.sh <owner-password> <admin-password>"
  echo "Generates bcrypt hashes and updates seed users via API container."
  exit 1
fi

OWNER_PASS="$1"
ADMIN_PASS="$2"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
COMPOSE="docker compose -f docker-compose.prod.yml"

hash_pass() {
  $COMPOSE --env-file "$ENV_FILE" exec -T api node -e "
    const bcrypt = require('bcryptjs');
    bcrypt.hash(process.argv[1], 10).then(h => console.log(h));
  " "$1"
}

OWNER_HASH=$(hash_pass "$OWNER_PASS")
ADMIN_HASH=$(hash_pass "$ADMIN_PASS")

$COMPOSE --env-file "$ENV_FILE" exec -T postgres psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-sub_based_internet}" <<SQL
UPDATE "User" SET "passwordHash" = '$OWNER_HASH' WHERE email = 'owner@demo.com';
UPDATE "User" SET "passwordHash" = '$ADMIN_HASH' WHERE email = 'admin@platform.com';
SQL

echo "Passwords updated for owner@demo.com and admin@platform.com"
