# Task: Production Deploy Walkthrough

- **ID:** 014
- **Status:** completed
- **Sprint:** 7
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Step-by-step production deployment guide: VPS setup, Docker stack, HTTPS, Stripe webhooks, and post-deploy checks.

## Acceptance Criteria

- [x] Architecture doc with full deploy walkthrough
- [x] nginx HTTPS example config
- [x] Post-deploy verification checklist
- [x] README links to guide

## Files Touched

- `output/architecture/production-deploy.md`
- `deploy/nginx-ssl.conf.example`
- `README.md`

## Verification

Follow `output/architecture/production-deploy.md`; confirm `/health`, login, and Stripe webhook endpoint reachable.
