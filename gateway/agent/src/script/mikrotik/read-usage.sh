#!/bin/sh
# Read usage from simple queue counters (bytes)
# Usage: read-usage.sh <mac>

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
OUT=$(run_ros "/queue simple print stats where name=wifi-saas-$MAC" 2>/dev/null) || OUT=""

BYTES_IN=0
BYTES_OUT=0
if echo "$OUT" | grep -q "rx-byte"; then
  BYTES_IN=$(echo "$OUT" | sed -n 's/.*rx-byte=\([0-9]*\).*/\1/p' | head -1)
  BYTES_OUT=$(echo "$OUT" | sed -n 's/.*tx-byte=\([0-9]*\).*/\1/p' | head -1)
fi

echo "{\"bytesIn\":${BYTES_IN:-0},\"bytesOut\":${BYTES_OUT:-0}}"
