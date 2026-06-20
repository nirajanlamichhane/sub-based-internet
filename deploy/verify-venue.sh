#!/usr/bin/env bash
# Verify gateway agent connectivity for a venue location
# Usage: bash deploy/verify-venue.sh <BASE_URL> <GATEWAY_KEY>

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: bash deploy/verify-venue.sh <BASE_URL> <GATEWAY_KEY>"
  echo "Example: bash deploy/verify-venue.sh https://your-domain.com dev-gateway-key-downtown"
  exit 1
fi

BASE_URL="${1%/}"
GATEWAY_KEY="$2"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }

fail=0

check() {
  local name="$1" code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${@:2}")
  if [[ "$code" =~ ^2 ]]; then
    green "OK  $name (HTTP $code)"
  else
    red "FAIL $name (HTTP $code)"
    fail=1
  fi
}

green "Verifying gateway at $BASE_URL ..."

HB=$(curl -sf -X POST "$BASE_URL/gateway/heartbeat" \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Key: $GATEWAY_KEY" \
  -d '{"wanStatus":"up","uptimeSeconds":60}' || echo "")

if echo "$HB" | grep -q '"licenseStatus"'; then
  green "OK  gateway heartbeat"
else
  red "FAIL gateway heartbeat"
  fail=1
fi

SESS=$(curl -sf "$BASE_URL/gateway/sessions" \
  -H "X-Gateway-Key: $GATEWAY_KEY" || echo "")

if echo "$SESS" | grep -q '"sessions"'; then
  green "OK  gateway sessions poll"
else
  red "FAIL gateway sessions poll"
  fail=1
fi

if [[ "$fail" -eq 0 ]]; then
  green "Venue gateway checks passed."
  echo "Next: configure nodogsplash → $BASE_URL/portal/{slug}?mac=\$clientmac"
  echo "See: output/architecture/openwrt-venue-pilot.md"
else
  red "Venue gateway checks failed."
  exit 1
fi
