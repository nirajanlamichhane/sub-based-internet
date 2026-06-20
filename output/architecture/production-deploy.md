# Production Deployment Walkthrough

Living document — cloud deployment for task 014.

## Overview

Deploy the full stack (Postgres, Redis, API, web, nginx) on a VPS or cloud VM using Docker Compose.

```text
Internet
   │
   ▼
nginx :443 ──┬──► web :3000   (Next.js dashboard + portal)
             └──► api :3001   (NestJS)
                      │
                 postgres + redis
```

Gateway agents at venues connect **outbound** to `https://your-domain.com/gateway/*` — no inbound ports needed at venues.

## Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| VPS | 2 vCPU, 2 GB RAM, 20 GB disk | 2 vCPU, 4 GB RAM, 40 GB SSD |
| OS | Ubuntu 22.04+ or Debian 12 | Ubuntu 24.04 LTS |
| Domain | A record → server IP | + `www` CNAME optional |
| TLS | Let's Encrypt (certbot) | Auto-renew via certbot |

Software on server:

```bash
# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
docker compose version
```

## Step 1 — DNS

Point your domain to the server:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `203.0.113.50` (your VPS IP) |
| A | `www` | `203.0.113.50` (optional) |

Wait for propagation (`dig your-domain.com +short`).

## Step 2 — Clone and configure

```bash
git clone <your-repo-url> sub-based-internet
cd sub-based-internet
cp .env.production.example .env
```

Edit `.env` — **required values:**

```bash
# Strong passwords — generate with: openssl rand -hex 32
POSTGRES_PASSWORD=<random-32-chars>
JWT_SECRET=<random-32-chars>
JWT_REFRESH_SECRET=<random-32-chars>

DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@postgres:5432/sub_based_internet
REDIS_URL=redis://redis:6379

# Your public URL (same origin — nginx proxies API + web)
WEB_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
HTTP_PORT=80

# Stripe (optional but recommended for billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

**Important:** `NEXT_PUBLIC_API_URL` is baked into the web Docker image at **build time**. It must match your public domain. Rebuild web after changing it:

```bash
docker compose -f docker-compose.prod.yml build web
```

## Step 3 — Build and start

```bash
bash deploy/setup-production.sh
```

Or manually:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

First deploy with demo data:

```bash
SEED=1 bash deploy/setup-production.sh
# Or: docker compose -f docker-compose.prod.yml --profile seed run --rm seed
```

Services started:

| Service | Role |
|---------|------|
| `postgres` | Database |
| `redis` | Cache, locks, BullMQ |
| `migrate` | One-shot Prisma migrations |
| `api` | NestJS API |
| `web` | Next.js app |
| `nginx` | Reverse proxy on port 80 |

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

## Step 4 — Seed (first deploy only)

```bash
docker compose -f docker-compose.prod.yml exec api sh -c "cd /app && pnpm db:seed"
```

Or run seed from host if you have pnpm + DATABASE_URL pointing at the server.

**Change default passwords immediately** after seed in production.

## Step 5 — HTTPS (Let's Encrypt)

### Option A — Certbot on host (recommended)

Install certbot and obtain certs:

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
# Stop nginx temporarily if port 80 is in use, or use webroot mode
```

Certs land in `/etc/letsencrypt/live/your-domain.com/`.

Copy or symlink into project:

```bash
mkdir -p deploy/certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem deploy/certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem deploy/certs/
sudo chmod 644 deploy/certs/*.pem
```

Use `deploy/nginx-ssl.conf.example` as reference — merge SSL server block into `deploy/nginx.conf` or replace nginx config:

1. Uncomment / copy the `443` server block from `deploy/nginx-ssl.conf.example`
2. Set `server_name your-domain.com`
3. Mount certs in `docker-compose.prod.yml`:

```yaml
nginx:
  volumes:
    - ./deploy/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./deploy/certs:/etc/nginx/certs:ro
  ports:
    - "80:80"
    - "443:443"
```

4. Add HTTP → HTTPS redirect in port 80 server block
5. Restart: `docker compose -f docker-compose.prod.yml up -d nginx`

Auto-renew:

```bash
sudo certbot renew --dry-run
# Add cron: 0 3 * * * certbot renew --quiet && cp certs && docker compose restart nginx
```

### Option B — Cloudflare (proxy)

Point domain through Cloudflare orange cloud. Origin can use HTTP on port 80 internally; Cloudflare terminates TLS. Set SSL mode to **Full (strict)** if using origin certs.

## Step 6 — Stripe webhooks

Full guide: [stripe-live-setup.md](./stripe-live-setup.md)

1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/billing/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` in `.env`
5. Restart API: `docker compose -f docker-compose.prod.yml up -d api`

Test:

```bash
stripe listen --forward-to https://your-domain.com/billing/webhook
stripe trigger checkout.session.completed
```

## Step 7 — Post-deploy verification

Run this checklist:

```bash
bash deploy/verify-production.sh https://your-domain.com
```

Or manually:

```bash
curl -s https://your-domain.com/health | jq .

curl -s -X POST https://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"password123"}' | jq .accessToken

curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/portal/downtown-cafe

API_URL=https://your-domain.com pnpm test:e2e
```

Manual checks:

- [ ] https://your-domain.com/login — dashboard loads
- [ ] https://your-domain.com/admin — platform admin (change seed password first)
- [ ] https://your-domain.com/portal/{slug} — captive portal
- [ ] Create voucher → redeem → session in dashboard
- [ ] `/dashboard/billing` — Stripe checkout (test mode)
- [ ] Gateway agent at venue gets heartbeat OK (after pilot setup)

## Step 8 — Operations

### View logs

```bash
docker compose -f docker-compose.prod.yml logs -f api web nginx
```

### Apply database migrations (updates)

```bash
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml up -d api
```

### Restart stack

```bash
docker compose -f docker-compose.prod.yml restart
```

### Backup Postgres

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres sub_based_internet > backup-$(date +%F).sql
```

Restore:

```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres sub_based_internet
```

### Update application

```bash
git pull
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml run --rm migrate
```

## Environment reference

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Internal Docker hostname `postgres` |
| `REDIS_URL` | Yes | Internal `redis://redis:6379` |
| `JWT_SECRET` | Yes | Unique per environment |
| `JWT_REFRESH_SECRET` | Yes | Unique per environment |
| `WEB_URL` | Yes | Public HTTPS origin (CORS) |
| `NEXT_PUBLIC_API_URL` | Yes | Same as `WEB_URL` when using nginx proxy |
| `STRIPE_*` | Billing | Live keys for production |
| `HTTP_PORT` | No | Default 80 |

## Security checklist

- [ ] Change all seed passwords (`owner@demo.com`, `admin@platform.com`)
- [ ] Strong `POSTGRES_PASSWORD` — not exposed publicly
- [ ] Firewall: allow 80, 443 only (`ufw allow 80,443/tcp && ufw enable`)
- [ ] Do not expose Postgres/Redis ports publicly (Docker internal network only)
- [ ] Stripe webhook secret configured; verify signatures (handled by API)
- [ ] Regular backups of Postgres volume

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `migrate` fails | Check `DATABASE_URL`; ensure postgres healthy |
| API unhealthy | `docker compose logs api` — often Redis version or DB connection |
| Web shows wrong API URL | Rebuild web with correct `NEXT_PUBLIC_API_URL` build arg |
| 502 from nginx | Wait for api/web healthchecks; `docker compose ps` |
| CORS errors | `WEB_URL` must match browser origin exactly |
| Stripe webhook 400 | Raw body required — already enabled in `main.ts`; check secret |

## Manual deploy (without Docker)

If you prefer managed services:

1. **Postgres** — RDS, Supabase, Neon → set `DATABASE_URL`
2. **Redis** — ElastiCache, Upstash (Redis 6.2+) → set `REDIS_URL`
3. **API** — `pnpm build && node apps/api/dist/main.js` on VM or container
4. **Web** — Vercel/Netlify with `NEXT_PUBLIC_API_URL` → API subdomain, or same-origin nginx

## Related docs

- [openwrt-venue-pilot.md](./openwrt-venue-pilot.md) — Venue router setup
- [gateway-protocol.md](./gateway-protocol.md) — Gateway agent protocol
- [api-contracts.md](./api-contracts.md) — REST API
