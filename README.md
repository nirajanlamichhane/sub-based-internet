# Sub-Based Internet

Multi-tenant Wi-Fi subscription platform for cafés, hotels, restaurants, and public venues. Venue owners sell time-limited Wi-Fi access via QR vouchers; customers redeem on a captive portal; a local gateway agent enforces access on the router.

> **New to this project?** Read the step-by-step guide: **[Installation & Production Guide (Beginners)](output/architecture/installation-production-guide.md)**

## Features

- **Owner dashboard** — plans, voucher generation, QR codes, live sessions, reports, Stripe billing
- **Captive portal** — terms acceptance, voucher redeem, MAC binding, session countdown
- **Gateway agent** — polls cloud for active sessions, applies ALLOW/BLOCK/SHAPE on router (mock driver for dev)
- **Background jobs** — session/voucher expiry via BullMQ, Redis redeem locks, rate limiting, license enforcement

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| pnpm | 9+ |
| Docker | For PostgreSQL 16 and Redis 7 (Redis must be **5.0+** — BullMQ will not start on older Redis) |

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

- Dashboard: http://localhost:3000/login → owners land on `/dashboard`
- Platform admin: same login → `/admin` (tenant management)
- Captive portal: http://localhost:3000/portal/downtown-cafe
- Gateway key (seed): `dev-gateway-key-downtown`

## Environment Variables

Copy `.env.example` to `.env` at the repo root. All apps read from this file.

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sub_based_internet` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` (must be Redis 5+) |
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
| `GATEWAY_LAN_DEV` | OpenWRT LAN bridge (when `openwrt`) | `br-lan` |
| `GATEWAY_FAIL_FAST` | Exit on script errors (production) | unset |
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
| `pnpm test` | Run unit + E2E tests |
| `pnpm test:unit` | Run API unit tests only |
| `pnpm test:e2e` | Run E2E happy-path test against live API |
| `pnpm docker:prod` | Build and start production stack (Docker) |
| `bash deploy/setup-production.sh` | Validate env, deploy, wait for health (Linux VPS) |
| `bash deploy/post-deploy-checklist.sh` | Run all post-deploy verification |
| `bash deploy/setup-ssl.sh` | Obtain Let's Encrypt certs and enable HTTPS |
| `bash deploy/setup-firewall.sh` | Configure UFW (ports 22, 80, 443) |
| `bash deploy/backup-postgres.sh` | Backup database to `backups/` |
| `bash deploy/rotate-seed-passwords.sh` | Change default seed user passwords |
| `bash deploy/verify-stripe.sh` | Validate Stripe env configuration |
| `bash deploy/verify-venue.sh` | Test gateway agent connectivity |
| `bash deploy/setup-monitoring.sh` | Health probe for cron/monitoring |
| `bash deploy/verify-production.sh` | Post-deploy HTTP checks |
| `powershell -File deploy/make-packages.ps1` | Create `deploy/production-cloud.zip` + `gateway-venue.zip` |

## E2E Test

The happy-path test exercises the full flow via HTTP:

1. Owner login
2. List locations and plans
3. Generate voucher
4. Redeem voucher (captive portal API)
5. Assert double-redeem is rejected
6. Session visible in dashboard API
7. Gateway heartbeat + session poll
8. Billing subscription endpoint (Phase 2)

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
| [output/architecture/installation-production-guide.md](output/architecture/installation-production-guide.md) | **Start here — full install & production guide for beginners** |
| [output/architecture/data-model.md](output/architecture/data-model.md) | Database entities |
| [output/architecture/api-contracts.md](output/architecture/api-contracts.md) | REST API reference |
| [output/architecture/gateway-protocol.md](output/architecture/gateway-protocol.md) | Gateway agent protocol |
| [output/architecture/production-deploy.md](output/architecture/production-deploy.md) | **Production deploy walkthrough** (VPS, Docker, HTTPS, Stripe) |
| [output/architecture/openwrt-venue-pilot.md](output/architecture/openwrt-venue-pilot.md) | **OpenWRT venue pilot guide** (captive portal + gateway agent) |
| [output/architecture/stripe-live-setup.md](output/architecture/stripe-live-setup.md) | **Stripe live setup** (products, webhooks, billing test) |

## Deployment

### Production (cloud)

Full step-by-step guide: **[output/architecture/production-deploy.md](output/architecture/production-deploy.md)**

Quick start:

```bash
cp .env.production.example .env
# Edit secrets, domain, Stripe keys — see production-deploy.md
bash deploy/setup-production.sh          # or: pnpm docker:prod
SEED=1 bash deploy/setup-production.sh   # first deploy only
bash deploy/verify-production.sh https://your-domain.com
```

Deploy scripts: `deploy/setup-production.sh`, `deploy/verify-production.sh`, `deploy/install-gateway-agent.sh`

HTTPS: see `deploy/nginx-ssl.conf.example` + certbot steps in the deploy guide.

Stripe: see [output/architecture/stripe-live-setup.md](output/architecture/stripe-live-setup.md)

### Venue pilot (OpenWRT)

Full step-by-step guide: **[output/architecture/openwrt-venue-pilot.md](output/architecture/openwrt-venue-pilot.md)**

Quick reference:

1. Deploy cloud stack (above)
2. Configure nodogsplash → `/portal/{locationSlug}?mac=$clientmac`
3. Install gateway agent on sidecar:

```bash
sudo bash deploy/install-gateway-agent.sh
# Edit /etc/wifi-saas/gateway.env → systemctl restart wifi-saas-gateway
```

Or use OpenWRT procd: `deploy/gateway-agent.procd`

4. Run verification checklist from the pilot guide

### Local development

`docker compose up -d` starts Postgres and Redis only. Run apps with `pnpm dev` (see Quick Start above).

Stripe (optional locally): `stripe listen --forward-to localhost:3001/billing/webhook`

## Contributing

Read `rules/README.md` before contributing. API calls from the web app go through `apps/web/src/lib/api-client.ts`; shared validation lives in `packages/shared`.
