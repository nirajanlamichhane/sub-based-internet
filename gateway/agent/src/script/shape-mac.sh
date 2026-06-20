#!/bin/sh
# Update bandwidth limit for MAC (OpenWRT stub)
# Usage: shape-mac.sh <mac> <speed_mbps>
MAC="$1"
SPEED="$2"
echo "tc class change dev br-lan parent 1:1 classid 1:$(echo $MAC | tr -d ':') htb rate ${SPEED}mbit"
