# Task: Prisma Schema

- **ID:** 002
- **Status:** completed
- **Sprint:** 1
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Define Prisma schema for all core entities, run migrations, and create seed script with demo tenant/location/plans.

## Acceptance Criteria

- [x] Models: Tenant, Location, User, WifiPlan, Voucher, WifiSession, AuditLog
- [x] Enums: SaaSPlan, LicenseStatus, VoucherStatus, SessionStatus, Role
- [x] Initial migration created (`20250619120000_init`)
- [x] Seed script creates demo tenant, owner user, location, 4 wifi plans
- [x] `output/architecture/data-model.md` updated to match schema

## Files Touched

- `packages/db/prisma/schema.prisma` — full schema
- `packages/db/prisma/migrations/20250619120000_init/migration.sql`
- `packages/db/prisma/migrations/migration_lock.toml`
- `packages/db/src/seed.ts` — demo data seed
- `packages/db/src/env.ts` — loads root `.env`
- `packages/db/package.json` — bcryptjs, dotenv, prisma seed config
- `packages/shared/src/constants/enums.ts` — shared enum mirrors + DEFAULT_WIFI_PLANS
- `packages/shared/src/types/entities.ts` — DTO interfaces
- `packages/shared/src/utils/token.ts` — generateToken utility
- `output/architecture/data-model.md`
- `package.json` — db:generate, db:migrate:deploy, db:studio scripts
- `.env.example` — gateway key aligned with seed

## Notes / Decisions

- Enums mirrored in `packages/shared/constants/enums.ts` for web/API (no Prisma import in shared)
- Seed uses stable IDs for tenant/plans to support idempotent re-runs
- Location upsert keyed on unique `gatewayKey`
- Demo passwords are dev-only (`password123`)

## Verification

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate:deploy   # apply migration
pnpm db:generate       # generate Prisma client
pnpm db:seed           # populate demo data
pnpm db:studio         # inspect tables
```

Expected seed output:
- Tenant: Demo Café Group
- Owner: owner@demo.com
- Location: downtown-cafe
- 4 wifi plans + sample voucher token
