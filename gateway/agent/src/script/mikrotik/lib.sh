#!/bin/sh
# MikroTik RouterOS helper — runs commands via SSH
# Requires: ssh, MIKROTIK_HOST, MIKROTIK_USER (default admin)

HOST="${MIKROTIK_HOST:-127.0.0.1}"
USER="${MIKROTIK_USER:-admin}"
PASS="${MIKROTIK_PASS:-}"
PORT="${MIKROTIK_SSH_PORT:-22}"

run_ros() {
  if [ -n "$PASS" ]; then
    sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$HOST" "$@"
  else
    ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$HOST" "$@"
  fi
}

normalize_mac() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr '-' ':'
}

export -f run_ros normalize_mac 2>/dev/null || true
