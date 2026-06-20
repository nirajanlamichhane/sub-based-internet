#!/usr/bin/env bash
# Validate Stripe configuration for production billing
# Usage: bash deploy/verify-stripe.sh [BASE_URL]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
BASE_URL="${1:-}"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
warn() { printf '\033[0;33m%s\033[0m\n' "$*"; }

fail=0

get_env() {
  grep -E "^${1}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '\r' || true
}

if [[ ! -f "$ENV_FILE" ]]; then
  red "Missing $ENV_FILE"
  exit 1
fi

STRIPE_KEY=$(get_env STRIPE_SECRET_KEY)
WEBHOOK=$(get_env STRIPE_WEBHOOK_SECRET)
P_STARTER=$(get_env STRIPE_PRICE_STARTER)
P_BUSINESS=$(get_env STRIPE_PRICE_BUSINESS)
P_ENTERPRISE=$(get_env STRIPE_PRICE_ENTERPRISE)

check_var() {
  local name="$1" val="$2"
  if [[ -z "$val" || "$val" == sk_test_* && "${REQUIRE_LIVE:-}" == "1" ]]; then
    red "MISSING or test key: $name"
    fail=1
  elif [[ -z "$val" ]]; then
    warn "SKIP $name (not set — billing disabled)"
  else
    green "OK  $name"
  fi
}

green "Checking Stripe env in $ENV_FILE ..."
check_var STRIPE_SECRET_KEY "$STRIPE_KEY"
check_var STRIPE_WEBHOOK_SECRET "$WEBHOOK"
check_var STRIPE_PRICE_STARTER "$P_STARTER"
check_var STRIPE_PRICE_BUSINESS "$P_BUSINESS"
check_var STRIPE_PRICE_ENTERPRISE "$P_ENTERPRISE"

if [[ -n "$BASE_URL" && -n "$STRIPE_KEY" ]]; then
  BASE_URL="${BASE_URL%/}"
  TOKEN=$(curl -sf -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"owner@demo.com","password":"password123"}' \
    | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p' || true)

  if [[ -n "$TOKEN" ]]; then
    RESP=$(curl -sf "$BASE_URL/billing/subscription" -H "Authorization: Bearer $TOKEN" || true)
    if echo "$RESP" | grep -q '"stripeConfigured":true'; then
      green "OK  API reports stripeConfigured=true"
    else
      warn "API stripeConfigured=false — check STRIPE_SECRET_KEY in API container"
      fail=1
    fi
  else
    warn "SKIP API billing check (login failed — change seed password?)"
  fi

  WEBHOOK_URL="$BASE_URL/billing/webhook"
  green "Register webhook in Stripe Dashboard: $WEBHOOK_URL"
  green "Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.paid"
fi

if [[ "$fail" -eq 0 ]]; then
  green "Stripe configuration looks good."
else
  red "Stripe configuration incomplete."
  exit 1
fi
