#!/usr/bin/env bash
# Configure UFW firewall for production — allow HTTP/HTTPS only
# Usage: sudo bash deploy/setup-firewall.sh

set -euo pipefail

if [[ "${EUID:-}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/setup-firewall.sh"
  exit 1
fi

if ! command -v ufw >/dev/null 2>&1; then
  echo "Installing ufw..."
  apt-get update -qq && apt-get install -y ufw
fi

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

echo "Enabling firewall (SSH, 80, 443)..."
ufw --force enable
ufw status verbose

echo "Firewall configured."
