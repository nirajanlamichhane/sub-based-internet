#!/bin/sh
# Initialize hotspot firewall chain for Wi-Fi SaaS
. "$(dirname "$0")/lib.sh"

run_ros '/ip firewall filter print where comment="wifi-saas"' | grep -q wifi-saas || \
  run_ros '/ip firewall filter add chain=forward action=drop comment=wifi-saas'

echo "INIT mikrotik wifi-saas chain"
