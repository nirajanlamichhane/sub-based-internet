#!/usr/bin/env bash
# Enable automatic HTTPS with Caddy (beginner-friendly)
# Prerequisites: DOMAIN DNS A record → this server, ports 80+443 open
# Usage: DOMAIN=mywifi.com ACME_EMAIL=you@mail.com bash deploy/setup-caddy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOMAIN="${DOMAIN:-}"
ACME_EMAIL="${ACME_EMAIL:-}"

if [[ -z "$DOMAIN" ]]; then
  echo "Set DOMAIN=your-domain.com"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.production.example .env
fi

grep -q "^DOMAIN=" .env 2>/dev/null && sed -i "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" .env || echo "DOMAIN=$DOMAIN" >> .env
grep -q "^ACME_EMAIL=" .env 2>/dev/null && sed -i "s/^ACME_EMAIL=.*/ACME_EMAIL=${ACME_EMAIL:-admin@$DOMAIN}/" .env || echo "ACME_EMAIL=${ACME_EMAIL:-admin@$DOMAIN}" >> .env

# Align public URLs with HTTPS domain
grep -q "^WEB_URL=" .env && sed -i "s|^WEB_URL=.*|WEB_URL=https://$DOMAIN|" .env || echo "WEB_URL=https://$DOMAIN" >> .env
grep -q "^NEXT_PUBLIC_API_URL=" .env && sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$DOMAIN|" .env || echo "NEXT_PUBLIC_API_URL=https://$DOMAIN" >> .env

echo "Building stack with Caddy HTTPS for $DOMAIN ..."
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml --env-file .env up --build -d

echo "Waiting for https://$DOMAIN/health ..."
for i in $(seq 1 90); do
  if curl -sf "https://$DOMAIN/health" >/dev/null 2>&1; then
    echo "HTTPS is live: https://$DOMAIN"
    exit 0
  fi
  sleep 3
done

echo "Stack started — DNS/ACME may still be propagating. Check: docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml logs caddy"
