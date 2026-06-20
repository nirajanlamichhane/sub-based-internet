#!/bin/sh
# Allow traffic for MAC and apply bandwidth shaping (OpenWRT stub)
# Usage: allow-mac.sh <mac> <speed_mbps> [ip]
MAC="$1"
SPEED="$2"
IP="$3"
echo "iptables -I FORWARD -m mac --mac-source $MAC -j ACCEPT"
echo "tc class add dev br-lan parent 1:1 classid 1:$(echo $MAC | tr -d ':') htb rate ${SPEED}mbit"
[ -n "$IP" ] && echo "Associated IP: $IP"
