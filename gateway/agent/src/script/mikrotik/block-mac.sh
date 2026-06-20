#!/bin/sh
# Block MAC — remove allow rules and queue
# Usage: block-mac.sh <mac>

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
[ -z "$MAC" ] && exit 1

run_ros "/ip firewall filter remove [find comment=wifi-saas-allow-$MAC]" 2>/dev/null || true
run_ros "/queue simple remove [find name=wifi-saas-$MAC]" 2>/dev/null || true

echo "BLOCK $MAC"
