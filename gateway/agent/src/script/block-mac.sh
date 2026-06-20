#!/bin/sh
# Block traffic for MAC — remove iptables rules and tc class
# Usage: block-mac.sh <mac>

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
require_mac "$MAC"
require_cmd iptables
require_cmd tc

CLASSID=$(grep -i "^${MAC}=" "$MAC_CLASS_MAP" 2>/dev/null | tail -1 | cut -d= -f2)

# Remove allow rule (repeat until gone)
while iptables -D WIFI_SAAS -m mac --mac-source "$MAC" -j ACCEPT 2>/dev/null; do :; done

# Remove mangle classify rule
while iptables -t mangle -D POSTROUTING -m mac --mac-source "$MAC" \
  -j CLASSIFY --set-class "1:${CLASSID}" 2>/dev/null; do :; done

# Remove tc class if we tracked it
if [ -n "$CLASSID" ]; then
  tc class delete dev "$LAN_DEV" classid "1:${CLASSID}" 2>/dev/null || true
  sed -i "/^${MAC}=/d" "$MAC_CLASS_MAP" 2>/dev/null || \
    grep -vi "^${MAC}=" "$MAC_CLASS_MAP" > "${MAC_CLASS_MAP}.tmp" 2>/dev/null && \
    mv "${MAC_CLASS_MAP}.tmp" "$MAC_CLASS_MAP" 2>/dev/null || true
fi

echo "BLOCK $MAC"
