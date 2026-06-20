# Task: Jobs & Security

- **ID:** 007
- **Status:** completed
- **Sprint:** 4
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Add BullMQ session expiry job, Redis redeem locks, license enforcement on gateway heartbeat.

## Acceptance Criteria

- [x] Redis SETNX lock on voucher redeem (one-time use)
- [x] BullMQ job expires sessions past `expiresAt`
- [x] Background job marks vouchers `EXPIRED` past `expiresAt`
- [x] Gateway heartbeat checks tenant license (ACTIVE/GRACE/EXPIRED)
- [x] AuditLog entries for voucher redeem, session suspend (already in task 003)
- [x] Rate limiting on public redeem endpoint

## Files Touched

- `apps/api/package.json` — ioredis, bullmq
- `apps/api/src/config/env.ts` — REDIS_URL, rate limit config
- `apps/api/src/common/redis/` — RedisService, RedisLockService, RedisModule
- `apps/api/src/common/guards/rate-limit.guard.ts`
- `apps/api/src/common/decorators/rate-limit.decorator.ts`
- `apps/api/src/common/license/` — LicenseService
- `apps/api/src/modules/jobs/` — BullMQ worker, ExpiryService
- `apps/api/src/modules/vouchers/vouchers.service.ts` — Redis lock on redeem
- `apps/api/src/modules/vouchers/vouchers.controller.ts` — @RateLimit on redeem
- `apps/api/src/modules/gateway/gateway.service.ts` — LicenseService integration
- `apps/api/src/app.module.ts` — Redis, Jobs, License modules
- `.env.example` — REDIS_URL, REDEEM_RATE_LIMIT

## Notes / Decisions

- Expiry job runs every 60s via BullMQ repeatable job
- Rate limit: 20 requests/min per IP on `POST /vouchers/redeem` (configurable)
- EXPIRED license returns empty session list + `licenseBlocked: true`
- GRACE license allows sessions with `warning: true` in heartbeat

## Verification

```bash
docker compose up -d          # postgres + redis required
pnpm install
pnpm dev

# Double redeem — second request fails
curl -X POST http://localhost:3001/vouchers/redeem \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN","macAddress":"aa:bb:cc:dd:ee:01","locationSlug":"downtown-cafe"}'
# Run twice with same token → 400 "already redeemed"

# Expired session — wait past expiresAt or set expiresAt in DB
# Gateway poll should return empty sessions for expired ACTIVE sessions

# Expired license — PATCH tenant licenseStatus to EXPIRED via platform admin
# Gateway GET /gateway/sessions → { sessions: [], licenseBlocked: true }
```
