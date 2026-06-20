#!/usr/bin/env bash
# Simple monitoring probe — curl health endpoints (for cron or external monitor)
# Usage: bash deploy/setup-monitoring.sh [BASE_URL]
# Cron: */5 * * * * bash /path/to/deploy/setup-monitoring.sh https://your-domain.com >> /var/log/wifi-saas-monitor.log 2>&1

set -euo pipefail

BASE_URL="${1:-http://localhost:${HTTP_PORT:-80}}"
BASE_URL="${BASE_URL%/}"
STAMP=$(date -Iseconds)

check() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" || echo "000")
  echo "$STAMP $path HTTP $code"
  [[ "$code" =~ ^2 ]]
}

fail=0
check "/health" || fail=1
check "/health/ready" || fail=1

METRICS=$(curl -sf "$BASE_URL/health/metrics" 2>/dev/null || echo "{}")
echo "$STAMP /health/metrics $METRICS"

if [[ "$fail" -eq 0 ]]; then
  echo "$STAMP status=ok"
else
  echo "$STAMP status=degraded"
  exit 1
fi
