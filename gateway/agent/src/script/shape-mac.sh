#!/bin/sh
# Update bandwidth limit for MAC
# Usage: shape-mac.sh <mac> <speed_mbps>

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
SPEED="$2"

require_mac "$MAC"
require_cmd tc

[ -z "$SPEED" ] && SPEED=10

CLASSID=$(classid_for_mac "$MAC")

if tc class show dev "$LAN_DEV" classid "1:${CLASSID}" 2>/dev/null | grep -q "htb"; then
  tc class change dev "$LAN_DEV" parent 1:1 classid "1:${CLASSID}" \
    htb rate "${SPEED}mbit" ceil "${SPEED}mbit"
else
  tc class add dev "$LAN_DEV" parent 1:1 classid "1:${CLASSID}" \
    htb rate "${SPEED}mbit" ceil "${SPEED}mbit"
fi

echo "SHAPE $MAC speed=${SPEED}mbit class=1:${CLASSID}"
