# Sub-Based Internet

Multi-tenant Wi-Fi subscription platform for cafés, hotels, restaurants, and public venues. Venue owners sell time-limited Wi-Fi access via QR vouchers; customers redeem on a captive portal; a local gateway agent enforces access on the router.

## Features

- **Owner dashboard** — plans, voucher generation, QR codes, live sessions, reports, billing stub
- **Captive portal** — terms acceptance, voucher redeem, MAC binding, session countdown
- **Gateway agent** — polls cloud for active sessions, applies ALLOW/BLOCK/SHAPE on router (mock driver for dev)
- **Background jobs** — session/voucher expiry via BullMQ, Redis redeem locks, rate limiting, license enforcement

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| pnpm | 9+ |
| Docker | For PostgreSQL 16 and Redis 7 |

## Quick Start

```bash
# 1. Environment
cp .env.example .env

# 2. Infrastructure
docker compose up -d

# 3. Dependencies
pnpm install

# 4. Database
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed

# 5. Run apps (API + web in parallel)
pnpm dev
```

| Service | URL |
|---------|-----|
| Web (dashboard + portal) | http://localhost:3000 |
| API health | http://localhost:3001/health |
| Gateway agent | `pnpm gateway:dev` (separate terminal) |

### Demo credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Venue owner | `owner@demo.com` | `password123` |
| Platform admin | `admin@platform.com` | `password123` |

- Dashboard: http://localhost:3000/login
- Captive portal: http://localhost:3000/portal/downtown-cafe
- Gateway key (seed): `dev-gateway-key-downtown`

## Environment Variables

Copy `.env.example` to `.env` at the repo root. All apps read from this file.

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sub_based_internet` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `API_PORT` | NestJS API port | `3001` |
| `JWT_SECRET` | Access token signing secret | *(change in production)* |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | *(change in production)* |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `WEB_URL` | Web app origin (CORS) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | API URL for browser | `http://localhost:3001` |
| `GATEWAY_API_URL` | API URL for gateway agent | `http://localhost:3001` |
| `GATEWAY_KEY` | Gateway auth key (per location) | `dev-gateway-key-downtown` |
| `GATEWAY_DRIVER` | `mock` or `openwrt` | `mock` |
| `GATEWAY_POLL_MS` | Session poll interval (ms) | `30000` |
| `GATEWAY_USAGE_MS` | Usage report interval (ms) | `300000` |
| `REDEEM_RATE_LIMIT` | Max redeem requests per window | `20` |
| `REDEEM_RATE_WINDOW_SEC` | Rate limit window (seconds) | `60` |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + web (Turborepo) |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Create/apply dev migrations |
| `pnpm db:migrate:deploy` | Apply migrations (CI/prod) |
| `pnpm db:seed` | Seed demo tenant, location, plans |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm gateway:dev` | Run gateway agent (mock driver) |
| `pnpm test:e2e` | Run E2E happy-path test against live API |

## E2E Test

The happy-path test exercises the full flow via HTTP:

1. Owner login
2. List locations and plans
3. Generate voucher
4. Redeem voucher (captive portal API)
5. Assert double-redeem is rejected
6. Session visible in dashboard API
7. Gateway heartbeat + session poll

**Run after the stack is up:**

```bash
docker compose up -d
pnpm db:migrate:deploy && pnpm db:seed
pnpm dev          # terminal 1 — keep API running
pnpm test:e2e     # terminal 2
```

Optional overrides: `API_URL`, `GATEWAY_KEY`, `E2E_OWNER_EMAIL`, `E2E_OWNER_PASSWORD`, `E2E_LOCATION_SLUG`, `E2E_TEST_MAC`.

## Project Structure

```
apps/
  api/          NestJS REST API (auth, tenants, vouchers, gateway, jobs)
  web/          Next.js dashboard + captive portal
packages/
  db/           Prisma schema, migrations, seed
  shared/       Enums, validators, types, utilities
gateway/
  agent/        On-prem gateway polling agent
rules/          Project conventions
output/         Task tracking and architecture docs
e2e/            End-to-end integration tests
```

See `rules/folder-structure.md` for coding conventions and `output/TASKS.md` for build history.

## Architecture

| Doc | Description |
|-----|-------------|
| [output/architecture/data-model.md](output/architecture/data-model.md) | Database entities |
| [output/architecture/api-contracts.md](output/architecture/api-contracts.md) | REST API reference |
| [output/architecture/gateway-protocol.md](output/architecture/gateway-protocol.md) | Gateway agent protocol |

## Deployment (overview)

### Cloud API + Web

1. Provision PostgreSQL and Redis (managed services recommended).
2. Set production env vars (`JWT_*` secrets, `DATABASE_URL`, `REDIS_URL`, `WEB_URL`, `NEXT_PUBLIC_API_URL`).
3. Run migrations: `pnpm db:migrate:deploy`.
4. Build: `pnpm build`.
5. Start API: `node apps/api/dist/main.js` (or container).
6. Start web: `pnpm --filter @sub-based-internet/web start` (or Vercel/similar with `NEXT_PUBLIC_API_URL` pointing to API).

### Gateway agent (per venue)

1. Install Node 20+ on the router or a small gateway box on the LAN.
2. Set `GATEWAY_API_URL`, `GATEWAY_KEY` (from dashboard location settings), and `GATEWAY_DRIVER=openwrt` on production hardware.
3. Run `pnpm gateway:dev` or use a process manager / systemd unit.
4. Configure captive portal DNS/DHCP to redirect unauthenticated clients to `/portal/{locationSlug}`.

### Docker infrastructure only

`docker compose up -d` starts Postgres and Redis locally. Application services are run via pnpm (not containerized in this MVP).

## Contributing

Read `rules/README.md` before contributing. API calls from the web app go through `apps/web/src/lib/api-client.ts`; shared validation lives in `packages/shared`.
