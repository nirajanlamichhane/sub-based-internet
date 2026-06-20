#!/bin/sh
# Shared helpers for OpenWRT traffic shaping scripts

LAN_DEV="${GATEWAY_LAN_DEV:-br-lan}"
STATE_DIR="${GATEWAY_STATE_DIR:-/tmp/wifi-saas}"
MAC_CLASS_MAP="${STATE_DIR}/mac-class.map"

mkdir -p "$STATE_DIR"

# Map MAC to a stable tc class minor (100–9999)
mac_to_classid() {
  mac="$1"
  hex=$(echo "$mac" | tr -d ':-' | tr '[:upper:]' '[:lower:]')
  tail4=${hex#${hex%????}}
  [ -z "$tail4" ] && tail4="0001"
  num=$(printf '%d' "0x$tail4" 2>/dev/null || echo 1)
  echo $((100 + num % 9900))
}

classid_for_mac() {
  mac="$1"
  if [ -f "$MAC_CLASS_MAP" ]; then
    found=$(grep -i "^${mac}=" "$MAC_CLASS_MAP" 2>/dev/null | tail -1 | cut -d= -f2)
    if [ -n "$found" ]; then
      echo "$found"
      return
    fi
  fi
  cid=$(mac_to_classid "$mac")
  echo "${mac}=${cid}" >> "$MAC_CLASS_MAP"
  echo "$cid"
}

normalize_mac() {
  echo "$1" | tr '[:upper:]' '[:lower:]'
}

require_mac() {
  if [ -z "$1" ]; then
    echo "MAC address required" >&2
    exit 1
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}
