#!/bin/sh
# Update speed for MAC queue
# Usage: shape-mac.sh <mac> <speed_mbps>

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
SPEED="${2:-10}"
BITS=$((SPEED * 1000000))

run_ros "/queue simple set [find name=wifi-saas-$MAC] max-limit=${BITS}/${BITS}" 2>/dev/null || true

echo "SHAPE $MAC speed=${SPEED}mbit"
