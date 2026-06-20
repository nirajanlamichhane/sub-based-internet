# Task: OpenWRT Driver (Production)

- **ID:** 009
- **Status:** completed
- **Sprint:** 6
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Replace stub shell scripts with real iptables/tc enforcement on OpenWRT hardware; add init/teardown, configurable LAN interface, and tc-based usage collection.

## Acceptance Criteria

- [x] Shell scripts execute real iptables + tc (not echo-only)
- [x] HTB qdisc init on agent start via `init-tc.sh` / `init-iptables.sh`
- [x] Configurable `GATEWAY_LAN_DEV` (default `br-lan`)
- [x] Stable MAC→classid mapping via `lib.sh`
- [x] `GATEWAY_FAIL_FAST=1` surfaces script errors in production
- [x] OpenWRT driver reads per-MAC usage from tc stats
- [x] Gateway protocol doc updated

## Files Touched

- `gateway/agent/src/script/lib.sh`, `init-tc.sh`, `init-iptables.sh`, `allow-mac.sh`, `block-mac.sh`, `shape-mac.sh`, `read-usage.sh`
- `gateway/agent/src/drivers/openwrt.driver.ts`, `types/driver.ts`
- `gateway/agent/src/utils/agent.ts`, `session-manager.ts`, `config.ts`, `types/config.ts`
- `output/architecture/gateway-protocol.md`

## Notes / Decisions

- Dev machines without iptables use `GATEWAY_DRIVER=mock` or `GATEWAY_DRY_RUN=1`.
- WIFI_SAAS iptables chain inserted into FORWARD; only session MACs are explicitly allowed.

## Verification

```bash
GATEWAY_DRIVER=openwrt GATEWAY_DRY_RUN=1 pnpm gateway:dev
# On OpenWRT device:
GATEWAY_DRIVER=openwrt GATEWAY_LAN_DEV=br-lan GATEWAY_FAIL_FAST=1 pnpm gateway:dev
```
