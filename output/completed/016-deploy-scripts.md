# Task: Deploy Automation Scripts

- **ID:** 016
- **Status:** completed
- **Sprint:** 8
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Add deploy scripts to automate production setup, verification, and venue gateway agent install.

## Acceptance Criteria

- [x] `deploy/setup-production.sh` — validate env, build, migrate, health wait
- [x] `deploy/verify-production.sh` — post-deploy curl checks
- [x] `deploy/install-gateway-agent.sh` — sidecar systemd install
- [x] `deploy/nodogsplash.uci.example` — OpenWRT captive portal snippet
- [x] Optional seed profile in docker-compose.prod.yml
- [x] README + production-deploy.md reference scripts

## Files Touched

- `deploy/setup-production.sh`, `verify-production.sh`, `install-gateway-agent.sh`
- `deploy/nodogsplash.uci.example`, `gateway-agent.service`
- `docker-compose.prod.yml`, `README.md`, `production-deploy.md`

## Verification

On Linux VPS: `bash deploy/setup-production.sh` then `bash deploy/verify-production.sh`
