#!/usr/bin/env bash
# Post-deploy verification — run after setup-production.sh
# Usage: bash deploy/verify-production.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-http://localhost:${HTTP_PORT:-80}}"
BASE_URL="${BASE_URL%/}"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
warn() { printf '\033[0;33m%s\033[0m\n' "$*"; }

fail=0

check() {
  local name="$1"
  shift
  if "$@"; then
    green "OK  $name"
  else
    red "FAIL $name"
    fail=1
  fi
}

green "Verifying $BASE_URL ..."

check "health endpoint" curl -sf "$BASE_URL/health" | grep -q '"status"'

check "readiness (DB + Redis)" curl -sf "$BASE_URL/health/ready" | grep -q '"checks"'

check "portal page" curl -sf -o /dev/null -w '' "$BASE_URL/portal/downtown-cafe"

check "login page" curl -sf -o /dev/null -w '' "$BASE_URL/login"

TOKEN=$(curl -sf -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"password123"}' | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p' || true)

if [[ -n "$TOKEN" ]]; then
  green "OK  owner login"
  check "billing subscription" curl -sf "$BASE_URL/billing/subscription" \
    -H "Authorization: Bearer $TOKEN" | grep -q '"plan"'
else
  warn "SKIP owner login (seed not run or password changed)"
fi

ADMIN_TOKEN=$(curl -sf -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"password123"}' | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p' || true)

if [[ -n "$ADMIN_TOKEN" ]]; then
  green "OK  admin login"
  check "tenants list" curl -sf "$BASE_URL/tenants" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q '"name"'
else
  warn "SKIP admin login (seed not run or password changed)"
fi

if [[ "$fail" -eq 0 ]]; then
  green "All checks passed."
else
  red "Some checks failed."
  exit 1
fi
