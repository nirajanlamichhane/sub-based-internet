#!/bin/sh
# Block traffic for MAC (OpenWRT stub)
# Usage: block-mac.sh <mac>
MAC="$1"
echo "iptables -D FORWARD -m mac --mac-source $MAC -j ACCEPT"
echo "tc filter del dev br-lan protocol ip parent 1:0 prio 1 handle $(echo $MAC | tr -d ':') fw"
