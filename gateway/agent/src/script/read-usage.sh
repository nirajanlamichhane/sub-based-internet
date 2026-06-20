#!/bin/sh
# Read byte counters for a MAC's tc class (JSON output)
# Usage: read-usage.sh <mac>
# Output: {"bytesIn": N, "bytesOut": N}

. "$(dirname "$0")/lib.sh"

MAC=$(normalize_mac "$1")
require_mac "$MAC"
require_cmd tc

CLASSID=$(grep -i "^${MAC}=" "$MAC_CLASS_MAP" 2>/dev/null | tail -1 | cut -d= -f2)
[ -z "$CLASSID" ] && CLASSID=$(mac_to_classid "$MAC")

stats=$(tc -s class show dev "$LAN_DEV" classid "1:${CLASSID}" 2>/dev/null)
bytes_out=$(echo "$stats" | grep -o 'Sent [0-9]* bytes' | head -1 | grep -o '[0-9]*')
bytes_in=$(echo "$stats" | grep -o 'received [0-9]* bytes' | head -1 | grep -o '[0-9]*')
[ -z "$bytes_out" ] && bytes_out=0
[ -z "$bytes_in" ] && bytes_in=0

echo "{\"bytesIn\": $bytes_in, \"bytesOut\": $bytes_out}"
