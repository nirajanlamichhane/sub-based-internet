#!/bin/sh
# Create WIFI_SAAS chain for session MAC allow rules
# Usage: init-iptables.sh

. "$(dirname "$0")/lib.sh"

require_cmd iptables

# Custom chain for allowed session MACs
iptables -N WIFI_SAAS 2>/dev/null || true

# Jump to WIFI_SAAS from FORWARD if not already present
if ! iptables -C FORWARD -j WIFI_SAAS 2>/dev/null; then
  iptables -I FORWARD 1 -j WIFI_SAAS
fi

echo "WIFI_SAAS chain ready"
