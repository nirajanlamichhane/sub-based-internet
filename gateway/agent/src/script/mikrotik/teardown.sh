#!/bin/sh
# Remove wifi-saas firewall rules and queues
. "$(dirname "$0")/lib.sh"

run_ros '/ip firewall filter remove [find comment~"wifi-saas"]' 2>/dev/null || true
run_ros '/queue simple remove [find name~"wifi-saas-"]' 2>/dev/null || true

echo "TEARDOWN mikrotik wifi-saas"
