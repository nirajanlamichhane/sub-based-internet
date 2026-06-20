#!/bin/sh
# Allow traffic for MAC and apply bandwidth shaping
# Usage: allow-mac.sh <mac> <speed_mbps> [ip]

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
SPEED="$2"
IP="$3"

require_mac "$MAC"
require_cmd iptables
require_cmd tc

[ -z "$SPEED" ] && SPEED=10

CLASSID=$(classid_for_mac "$MAC")

# Allow forwarded traffic from this MAC
if ! iptables -C WIFI_SAAS -m mac --mac-source "$MAC" -j ACCEPT 2>/dev/null; then
  iptables -I WIFI_SAAS -m mac --mac-source "$MAC" -j ACCEPT
fi

# Per-MAC HTB class
if tc class show dev "$LAN_DEV" classid "1:${CLASSID}" 2>/dev/null | grep -q "htb"; then
  tc class change dev "$LAN_DEV" parent 1:1 classid "1:${CLASSID}" \
    htb rate "${SPEED}mbit" ceil "${SPEED}mbit"
else
  tc class add dev "$LAN_DEV" parent 1:1 classid "1:${CLASSID}" \
    htb rate "${SPEED}mbit" ceil "${SPEED}mbit"
fi

# Classify outbound traffic from this MAC
if ! iptables -t mangle -C POSTROUTING -m mac --mac-source "$MAC" \
  -j CLASSIFY --set-class "1:${CLASSID}" 2>/dev/null; then
  iptables -t mangle -A POSTROUTING -m mac --mac-source "$MAC" \
    -j CLASSIFY --set-class "1:${CLASSID}"
fi

echo "ALLOW $MAC speed=${SPEED}mbit class=1:${CLASSID}${IP:+ ip=$IP}"
