# Gateway Protocol

Living document — synced with `gateway/agent/` implementation (task 006).

## Overview

The gateway agent runs on venue hardware. It polls the cloud API to sync sessions and enforce bandwidth policy locally.

**Run locally:** `pnpm gateway:dev` (uses `GATEWAY_KEY` from `.env`)

## Authentication

Every request includes:

```http
X-Gateway-Key: <location.gatewayKey>
```

## Agent Loop

1. `POST /gateway/heartbeat` — updates `lastHeartbeatAt` on location (dashboard Devices page)
2. `GET /gateway/sessions` — fetch active sessions
3. Diff vs locally enforced MACs → allow/block/shape via driver
4. `POST /gateway/usage` — every 5 minutes (mock driver simulates bytes)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_API_URL` | `http://localhost:3001` | Cloud API base URL |
| `GATEWAY_KEY` | `dev-gateway-key-downtown` | Location gateway key |
| `GATEWAY_DRIVER` | `mock` | `mock` or `openwrt` |
| `GATEWAY_POLL_MS` | `30000` | Heartbeat + session sync interval |
| `GATEWAY_USAGE_MS` | `300000` | Usage report interval |
| `GATEWAY_FIRMWARE` | `1.0.0` | Reported firmware version |
| `GATEWAY_LAN_DEV` | `br-lan` | OpenWRT LAN bridge interface for tc |
| `GATEWAY_STATE_DIR` | `/tmp/wifi-saas` | MAC→classid map persistence |
| `GATEWAY_DRY_RUN` | — | Set `1` to log script actions without executing |
| `GATEWAY_FAIL_FAST` | — | Set `1` to exit on script errors (production) |

## Drivers

| Driver | Implementation |
|--------|----------------|
| `MockDriver` | Logs ALLOW/BLOCK/SHAPE to stdout |
| `OpenWrtDriver` | Runs `init-iptables.sh` + `init-tc.sh` on start; `allow-mac.sh` / `block-mac.sh` / `shape-mac.sh` for enforcement; `read-usage.sh` reads tc byte counters |

## Offline Behavior

- Caches last successful session list in memory
- Continues enforcing cache for up to 1 hour (`GATEWAY_OFFLINE_GRACE_MS`)
- After grace period: logs warning, no new authorizations

## Captive Portal Redirect

OpenWRT (nodogsplash / CoovaChilli) redirects unauthenticated clients to:

```text
https://{APP_URL}/portal/{locationSlug}?mac=$(mac)&ip=$(ip)
```

**Full pilot guide:** [openwrt-venue-pilot.md](./openwrt-venue-pilot.md)

Deploy templates: `deploy/gateway-agent.env.example`, `deploy/gateway-agent.procd`, `deploy/gateway-agent.service`

## Status

- **Implemented** — tasks 006, 009, 013 (`gateway/agent/src/` + pilot guide)
