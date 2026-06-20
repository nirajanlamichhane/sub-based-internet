#!/bin/sh
# Allow MAC and set simple queue limit
# Usage: allow-mac.sh <mac> <speed_mbps> [ip]

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
SPEED="${2:-10}"
IP="$3"

[ -z "$MAC" ] && exit 1

# Accept forwarded traffic from MAC
run_ros "/ip firewall filter add chain=forward src-mac-address=$MAC action=accept comment=wifi-saas-allow-$MAC place-before=[find comment=wifi-saas]" 2>/dev/null || true

# Simple queue (max-limit in bits)
BITS=$((SPEED * 1000000))
run_ros "/queue simple add name=wifi-saas-$MAC target=$MAC max-limit=${BITS}/${BITS}" 2>/dev/null || \
  run_ros "/queue simple set [find name=wifi-saas-$MAC] max-limit=${BITS}/${BITS}" 2>/dev/null || true

echo "ALLOW $MAC speed=${SPEED}mbit${IP:+ ip=$IP}"
