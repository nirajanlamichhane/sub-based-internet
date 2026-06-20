#!/usr/bin/env bash
# Install gateway agent on a Linux sidecar (Pi / mini PC)
# Usage: sudo bash deploy/install-gateway-agent.sh /path/to/sub-based-internet

set -euo pipefail

REPO="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
INSTALL_DIR="/opt/wifi-saas"
ENV_DIR="/etc/wifi-saas"
ENV_FILE="$ENV_DIR/gateway.env"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }

if [[ "$(id -u)" -ne 0 ]]; then
  red "Run as root: sudo bash deploy/install-gateway-agent.sh"
  exit 1
fi

command -v node >/dev/null 2>&1 || { red "Node.js 20+ required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { red "pnpm required"; exit 1; }

green "Syncing repo to $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"
rsync -a --delete \
  --exclude node_modules --exclude .git --exclude .next --exclude dist \
  "$REPO/" "$INSTALL_DIR/"

green "Installing dependencies and building agent..."
cd "$INSTALL_DIR"
pnpm install --filter @sub-based-internet/gateway-agent...
pnpm --filter @sub-based-internet/gateway-agent build

mkdir -p "$ENV_DIR"
if [[ ! -f "$ENV_FILE" ]]; then
  cp deploy/gateway-agent.env.example "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  red "Created $ENV_FILE — edit GATEWAY_API_URL and GATEWAY_KEY, then:"
  echo "  systemctl enable --now wifi-saas-gateway"
  exit 0
fi

cp deploy/gateway-agent.service /etc/systemd/system/wifi-saas-gateway.service
systemctl daemon-reload
systemctl enable wifi-saas-gateway
systemctl restart wifi-saas-gateway

green "Gateway agent installed and started."
systemctl status wifi-saas-gateway --no-pager || true

echo ""
echo "Verify connectivity:"
echo "  bash deploy/verify-venue.sh <BASE_URL> <GATEWAY_KEY>"
echo "See: output/architecture/openwrt-venue-pilot.md"
