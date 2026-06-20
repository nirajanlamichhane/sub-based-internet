#!/bin/sh
# Initialize HTB qdisc hierarchy on the LAN interface
# Usage: init-tc.sh

. "$(dirname "$0")/lib.sh"

require_cmd tc

# Root qdisc
if ! tc qdisc show dev "$LAN_DEV" | grep -q "htb"; then
  tc qdisc add dev "$LAN_DEV" root handle 1: htb default 99
fi

# Root class — high ceiling; per-MAC classes rate-limit below this
if ! tc class show dev "$LAN_DEV" | grep -q "class htb 1:1"; then
  tc class add dev "$LAN_DEV" parent 1: classid 1:1 htb rate 1000mbit ceil 1000mbit
fi

# Default catch-all class for unclassified traffic
if ! tc class show dev "$LAN_DEV" | grep -q "class htb 1:99"; then
  tc class add dev "$LAN_DEV" parent 1:1 classid 1:99 htb rate 512kbit ceil 1mbit
fi

echo "HTB initialized on $LAN_DEV"
