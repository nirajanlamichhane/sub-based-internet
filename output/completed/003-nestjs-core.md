# Task: NestJS Core API

- **ID:** 003
- **Status:** completed
- **Sprint:** 1
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Build NestJS modules: auth, tenants, locations, plans, vouchers, sessions, gateway, reports — with tenant isolation guards.

## Acceptance Criteria

- [x] Auth module: login, refresh, register, JWT strategy
- [x] TenantGuard on all tenant-scoped routes
- [x] Modules per `output/architecture/api-contracts.md`
- [x] Shared Zod validators from `packages/shared`
- [x] Consistent error response shape per `rules/api-conventions.md`
- [x] Health check endpoint (public)

## Files Touched

- `apps/api/package.json` — JWT, passport, bcrypt, qrcode, db workspace dep
- `apps/api/src/config/env.ts`
- `apps/api/src/common/` — prisma, guards, filters, decorators, utils
- `apps/api/src/modules/auth/`
- `apps/api/src/modules/tenants/`
- `apps/api/src/modules/locations/`
- `apps/api/src/modules/wifi-plans/`
- `apps/api/src/modules/vouchers/`
- `apps/api/src/modules/sessions/`
- `apps/api/src/modules/gateway/`
- `apps/api/src/modules/reports/`
- `apps/api/src/app.module.ts`, `main.ts`
- `packages/shared/src/validators/` — auth, tenant, location, wifi-plan, voucher, gateway

## Notes / Decisions

- Global `JwtAuthGuard` + `@Public()` for open routes
- `TenantGuard` requires `tenantId` (platform admin uses `/tenants` only)
- `PlatformAdminGuard` for tenant management
- `GatewayKeyGuard` for gateway routes via `X-Gateway-Key`
- JWT access 15m, refresh 7d (no Redis blacklist until task 007)
- Voucher redeem uses DB transaction for one-time use (Redis lock in task 007)

## Verification

```bash
pnpm install
pnpm db:generate
pnpm --filter @sub-based-internet/api dev

# Health
curl http://localhost:3001/health

# Login (after seed)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"password123"}'

# Tenant-scoped (use accessToken from login)
curl http://localhost:3001/locations \
  -H "Authorization: Bearer <accessToken>"

# Gateway heartbeat
curl -X POST http://localhost:3001/gateway/heartbeat \
  -H "X-Gateway-Key: dev-gateway-key-downtown" \
  -H "Content-Type: application/json" \
  -d '{"wanStatus":"up"}'
```
