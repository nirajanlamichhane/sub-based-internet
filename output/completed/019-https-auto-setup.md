# Task: HTTPS Auto-Setup (Caddy + Certbot)

- **ID:** 019
- **Status:** completed
- **Sprint:** 9
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Production HTTPS with automatic Let's Encrypt certificates — Caddy overlay and certbot/nginx alternative.

## Acceptance Criteria

- [x] `deploy/Caddyfile` reverse proxy with auto TLS
- [x] `docker-compose.caddy.yml` overlay
- [x] `deploy/setup-caddy.sh` and `deploy/setup-https.sh` scripts
- [x] Routes include `/portal/sms/*` and `/billing/nepal/*`

## Files Touched

- `deploy/Caddyfile`, `docker-compose.caddy.yml`
- `deploy/setup-caddy.sh`, `deploy/setup-https.sh`

## Verification

Set `DOMAIN` and `ACME_EMAIL`, run Caddy overlay; site serves HTTPS.
