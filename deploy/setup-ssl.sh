#!/usr/bin/env bash
# Obtain Let's Encrypt certs and enable HTTPS in nginx
# Usage: sudo bash deploy/setup-ssl.sh your-domain.com [email]
# Prerequisites: DNS pointing to this server, stack running on port 80

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: sudo bash deploy/setup-ssl.sh <domain> [certbot-email]"
  exit 1
fi

DOMAIN="$1"
EMAIL="${2:-admin@$DOMAIN}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CERT_DIR="$ROOT/deploy/certs"
mkdir -p "$CERT_DIR"

if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -qq && apt-get install -y certbot
fi

echo "Obtaining certificate for $DOMAIN ..."
certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/"
chmod 644 "$CERT_DIR"/*.pem

echo "Rendering nginx config with HTTPS..."
sed "s/__DOMAIN__/$DOMAIN/g" "$ROOT/deploy/nginx-https.conf.template" > "$ROOT/deploy/nginx.conf"

echo "Restarting nginx..."
docker compose -f docker-compose.prod.yml --env-file .env up -d nginx

echo "HTTPS enabled for https://$DOMAIN"
echo "Add certbot renew cron: 0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem $CERT_DIR/ && docker compose -f $ROOT/docker-compose.prod.yml restart nginx"
