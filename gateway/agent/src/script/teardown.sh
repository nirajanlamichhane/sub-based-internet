#!/bin/sh
# Tear down WIFI_SAAS iptables chain and tc qdisc on agent shutdown
# Usage: teardown.sh

. "$(dirname "$0")/lib.sh"

require_cmd iptables

# Remove FORWARD jump to WIFI_SAAS
iptables -D FORWARD -j WIFI_SAAS 2>/dev/null || true

# Flush and delete WIFI_SAAS chain
iptables -F WIFI_SAAS 2>/dev/null || true
iptables -X WIFI_SAAS 2>/dev/null || true

# Remove root qdisc (tc shaping)
if command -v tc >/dev/null 2>&1; then
  tc qdisc del dev "$LAN_DEV" root 2>/dev/null || true
fi

# Clear state files
rm -f "$MAC_CLASS_MAP" 2>/dev/null || true

echo "WIFI_SAAS teardown complete"
