# Task: OpenWRT Venue Pilot Guide

- **ID:** 013
- **Status:** completed
- **Sprint:** 7
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Document end-to-end OpenWRT venue pilot: captive portal redirect, gateway agent install, session enforcement, and verification checklist.

## Acceptance Criteria

- [x] Architecture doc with hardware, network, and software prerequisites
- [x] nodogsplash captive portal configuration steps
- [x] Gateway agent install + procd/systemd unit example
- [x] Pilot verification checklist and troubleshooting
- [x] README links to guide

## Files Touched

- `output/architecture/openwrt-venue-pilot.md`
- `deploy/gateway-agent.env.example`, `deploy/gateway-agent.procd`, `deploy/gateway-agent.service`
- `README.md`, `output/architecture/gateway-protocol.md`

## Verification

Follow `output/architecture/openwrt-venue-pilot.md` checklist on test OpenWRT hardware.
