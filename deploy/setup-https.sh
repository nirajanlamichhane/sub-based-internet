#!/usr/bin/env bash
# Manual HTTPS with certbot + nginx (alternative to Caddy)
# Usage: DOMAIN=mywifi.com bash deploy/setup-https.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
DOMAIN="${DOMAIN:-}"

if [[ -z "$DOMAIN" ]]; then
  echo "Set DOMAIN=your-domain.com"
  exit 1
fi

apt-get update -qq && apt-get install -y -qq certbot

docker compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || certbot certonly --standalone -d "$DOMAIN"

mkdir -p deploy/certs
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" deploy/certs/
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" deploy/certs/

echo "Merge deploy/nginx-ssl.conf.example into deploy/nginx.conf, mount deploy/certs, expose 443, then:"
echo "  docker compose -f docker-compose.prod.yml up -d nginx"
