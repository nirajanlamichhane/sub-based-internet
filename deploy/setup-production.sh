#!/usr/bin/env bash
# Production deploy helper — run on VPS with Docker installed
# Usage: cp .env.production.example .env && edit .env && bash deploy/setup-production.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-.env}"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
warn() { printf '\033[0;33m%s\033[0m\n' "$*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { red "Missing required command: $1"; exit 1; }
}

require_env() {
  local key="$1"
  if [[ ! -f "$ENV_FILE" ]]; then
    red "Missing $ENV_FILE — copy .env.production.example to .env first"
    exit 1
  fi
  local val
  val=$(grep -E "^${key}=" "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)
  if [[ -z "$val" || "$val" == *"change-me"* || "$val" == *"your-domain"* ]]; then
    red "Set $key in $ENV_FILE before deploying"
    exit 1
  fi
}

require_cmd docker
docker compose version >/dev/null 2>&1 || { red "Docker Compose plugin required"; exit 1; }

if [[ ! -f "$ENV_FILE" ]]; then
  cp .env.production.example "$ENV_FILE"
  red "Created $ENV_FILE from template — edit secrets and domain, then re-run"
  exit 1
fi

# Load HTTP_PORT and other vars from .env
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

green "Validating environment..."
for key in DATABASE_URL POSTGRES_PASSWORD JWT_SECRET JWT_REFRESH_SECRET WEB_URL NEXT_PUBLIC_API_URL; do
  require_env "$key"
done

if [[ "${REQUIRE_STRIPE:-}" == "1" ]]; then
  for key in STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_PRICE_STARTER STRIPE_PRICE_BUSINESS STRIPE_PRICE_ENTERPRISE; do
    require_env "$key"
  done
else
  warn "Stripe not required (set REQUIRE_STRIPE=1 to enforce)"
fi

if [[ "$NEXT_PUBLIC_API_URL" != "$WEB_URL" ]]; then
  warn "NEXT_PUBLIC_API_URL ($NEXT_PUBLIC_API_URL) differs from WEB_URL ($WEB_URL) — use same origin when behind nginx"
fi

green "Building and starting stack..."
$COMPOSE --env-file "$ENV_FILE" up --build -d

green "Waiting for API readiness..."
for i in $(seq 1 60); do
  if curl -sf "http://localhost:${HTTP_PORT:-80}/health/ready" >/dev/null 2>&1; then
    green "API ready (DB + Redis healthy)"
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    red "API did not become ready in time — check: $COMPOSE logs api"
    exit 1
  fi
  sleep 2
done

if [[ "${SEED:-}" == "1" ]]; then
  green "Seeding database..."
  $COMPOSE --env-file "$ENV_FILE" --profile seed run --rm seed
  warn "Rotate seed passwords: bash deploy/rotate-seed-passwords.sh <owner-pass> <admin-pass>"
fi

green "Deploy complete."
echo "  Health: http://localhost:${HTTP_PORT:-80}/health"
echo "  Ready:  http://localhost:${HTTP_PORT:-80}/health/ready"
echo "  Run:    bash deploy/post-deploy-checklist.sh"
echo "  HTTPS:  sudo bash deploy/setup-ssl.sh your-domain.com"
echo "  Seed:   SEED=1 bash deploy/setup-production.sh  (first deploy only)"
