# Task: Gateway Agent

- **ID:** 006
- **Status:** completed
- **Sprint:** 4
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Create gateway agent with MockDriver + OpenWRT driver stub; heartbeat, session poll, usage reporting per gateway protocol.

## Acceptance Criteria

- [x] Agent polls cloud API on interval
- [x] MockDriver logs allow/block/speed actions
- [x] OpenWrtDriver stub with `script/` helpers for tc/iptables
- [x] Heartbeat, session sync, usage report implemented
- [x] `pnpm gateway:dev` runs mock agent locally
- [x] Devices page shows gateway online/offline (auto-refresh every 30s)

## Files Touched

- `gateway/agent/src/index.ts` — entry point
- `gateway/agent/src/utils/agent.ts` — main poll loop
- `gateway/agent/src/utils/cloud-api.ts` — API client
- `gateway/agent/src/utils/session-manager.ts` — session diff + enforce
- `gateway/agent/src/utils/offline-cache.ts` — offline grace cache
- `gateway/agent/src/drivers/` — MockDriver, OpenWrtDriver, factory
- `gateway/agent/src/script/` — allow-mac.sh, block-mac.sh, shape-mac.sh
- `gateway/agent/src/types/` — config, session, driver types
- `apps/web/src/components/devices/DevicesPage.tsx` — 30s auto-refresh
- `.env.example` — gateway env vars
- `output/architecture/gateway-protocol.md`

## Notes / Decisions

- Mock driver simulates usage bytes for usage report testing
- OpenWRT scripts echo commands on dev; set `GATEWAY_DRY_RUN=1` to skip shell exec
- Session sync normalizes MAC addresses to lowercase

## Verification

```bash
pnpm install
pnpm db:seed
pnpm dev                    # API + web in one terminal
pnpm gateway:dev            # agent in another

# Expect logs:
# [GatewayAgent] heartbeat license=ACTIVE
# [MockDriver] ALLOW aa:bb:cc:dd:ee:01 @ 2Mbps  (after portal redeem)

# Dashboard → Devices → gateway shows "Online" within 60s
```
