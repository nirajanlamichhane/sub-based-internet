# Task: MikroTik Gateway Driver

- **ID:** 023
- **Status:** completed
- **Sprint:** 9
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

MikroTik RouterOS driver for venue gateways — MAC allow/block, queue shaping, usage via SSH scripts.

## Acceptance Criteria

- [x] `MikroTikDriver` in `gateway/agent/src/drivers/`
- [x] Shell scripts under `gateway/agent/src/script/mikrotik/`
- [x] `GATEWAY_DRIVER=mikrotik` + `MIKROTIK_*` env vars
- [x] DRY_RUN and FAIL_FAST parity with OpenWRT driver

## Files Touched

- `gateway/agent/src/drivers/mikrotik.driver.ts`
- `gateway/agent/src/script/mikrotik/*.sh`
- `gateway/agent/src/types/config.ts`, `utils/config.ts`

## Verification

`GATEWAY_DRIVER=mikrotik GATEWAY_DRY_RUN=1 pnpm gateway:dev` logs script invocations.
