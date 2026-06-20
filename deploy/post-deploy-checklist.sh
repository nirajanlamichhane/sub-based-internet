#!/usr/bin/env bash
# Post-deploy operator checklist — runs all automated verification scripts
# Usage: bash deploy/post-deploy-checklist.sh [BASE_URL]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_URL="${1:-http://localhost:${HTTP_PORT:-80}}"

echo "=== Post-deploy checklist ==="
echo ""

bash "$ROOT/deploy/verify-production.sh" "$BASE_URL"

if [[ -f "$ROOT/.env" ]]; then
  bash "$ROOT/deploy/verify-stripe.sh" "$BASE_URL" || true
fi

echo ""
echo "Manual steps remaining:"
echo "  [ ] Rotate seed passwords: bash deploy/rotate-seed-passwords.sh <owner-pass> <admin-pass>"
echo "  [ ] Enable HTTPS: sudo bash deploy/setup-ssl.sh your-domain.com"
echo "  [ ] Configure firewall: sudo bash deploy/setup-firewall.sh"
echo "  [ ] Schedule backups: crontab -e → 0 3 * * * bash $ROOT/deploy/backup-postgres.sh"
echo "  [ ] Venue pilot: bash deploy/verify-venue.sh $BASE_URL <gateway-key>"
echo ""
echo "See output/architecture/production-deploy.md for full checklist."
