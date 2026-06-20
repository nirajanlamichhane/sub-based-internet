# Installation & Production Guide (Beginners)

**Start here if you are new.** This guide explains everything step by step — from installing on your computer to going live on the internet.

---

## Table of contents

1. [What is this project?](#1-what-is-this-project)
2. [Important: this is NOT a website for htdocs](#2-important-this-is-not-a-website-for-htdocs)
3. [What you need before starting](#3-what-you-need-before-starting)
4. [Part A — Install on your computer (local testing)](#part-a--install-on-your-computer-local-testing)
5. [Part B — Use the app locally](#part-b--use-the-app-locally)
6. [Part C — Prepare for production (real business)](#part-c--prepare-for-production-real-business)
7. [Part D — Deploy to a VPS (cloud server)](#part-d--deploy-to-a-vps-cloud-server)
8. [Part E — Add HTTPS (secure padlock)](#part-e--add-https-secure-padlock)
9. [Part F — Stripe payments (optional)](#part-f--stripe-payments-optional)
10. [Part G — Connect a venue router (Wi-Fi)](#part-g--connect-a-venue-router-wi-fi)
11. [Part H — Go-live checklist](#part-h--go-live-checklist)
12. [Troubleshooting for beginners](#troubleshooting-for-beginners)
13. [Quick reference](#quick-reference)

---

## 1. What is this project?

This is a **Wi-Fi subscription platform** for cafés, hotels, and venues:

| Who | What they do |
|-----|----------------|
| **Venue owner** | Logs in, creates Wi-Fi plans, prints QR vouchers, sees who is online |
| **Customer** | Connects to WiFi, scans QR or enters code, gets internet for a set time |
| **Gateway (router)** | Enforces who gets internet and speed limits |
| **Platform admin** | Creates tenant accounts, manages licenses |

**Three main parts:**

```text
┌─────────────────────────────────────────┐
│  CLOUD (your server on the internet)     │
│  • Website (dashboard + customer portal) │
│  • API (brain of the system)             │
│  • Database + Redis                      │
└──────────────────┬──────────────────────┘
                   │ internet
┌──────────────────▼──────────────────────┐
│  VENUE (café / hotel)                    │
│  • WiFi router (OpenWRT)                 │
│  • Gateway agent (allows/blocks users)   │
└─────────────────────────────────────────┘
```

---

## 2. Important: this is NOT a website for htdocs

If you use **XAMPP, WAMP, or cPanel htdocs** — this project **does not work there**.

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| Copy files to `htdocs` | Run on a **VPS** with Docker, or `pnpm dev` on your PC |
| PHP hosting | **Node.js** + **PostgreSQL** + **Redis** |
| Upload only HTML | Build and run **Next.js** + **NestJS** |

**Why?** The dashboard and API are Node.js applications, not static PHP files.

---

## 3. What you need before starting

### For local testing (on your PC)

| Software | Download | Why |
|----------|----------|-----|
| **Node.js 20+** | [nodejs.org](https://nodejs.org) | Runs the apps |
| **pnpm** | `npm install -g pnpm` | Installs project packages |
| **Docker Desktop** | [docker.com](https://www.docker.com/products/docker-desktop/) | Runs database + Redis |
| **Git** (optional) | [git-scm.com](https://git-scm.com) | Download the project |

### For production (live on internet)

| Item | Example | Cost (approx.) |
|------|---------|----------------|
| **Domain name** | `mywifi.com` | $10–15/year |
| **VPS server** | DigitalOcean, Linode, Vultr, AWS | $6–12/month |
| **Stripe account** (optional) | stripe.com | Free to start |

**VPS minimum:** 2 GB RAM, 2 CPU, 20 GB disk, **Ubuntu 22.04 or 24.04**.

---

## Part A — Install on your computer (local testing)

Follow these steps to run everything on your PC first. **Do this before production.**

### Step A1 — Get the project files

**Option 1 — Git:**
```bash
git clone <your-repo-url>
cd sub-based-internet
```

**Option 2 — Zip:** Unzip the project folder to e.g. `C:\Users\You\sub-based-internet`

### Step A2 — Install Node.js and pnpm

**Windows (PowerShell):**
```powershell
node -v    # Should show v20 or higher
npm install -g pnpm
pnpm -v
```

If `node` is not found, install from [nodejs.org](https://nodejs.org) and restart the terminal.

### Step A3 — Create your environment file

```bash
cp .env.example .env
```

On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

The `.env` file holds passwords and URLs. For local testing, the defaults are usually fine.

**Windows Redis note:** If the API fails with "Redis version needs to be greater than 5.0.0", your PC may have an old Redis on port 6379. Use Docker Redis instead:

```text
REDIS_URL=redis://localhost:6379
```

Make sure `docker compose up -d` is running (Step A4).

### Step A4 — Start database and Redis

Open a terminal in the project folder:

```bash
docker compose up -d
```

Wait 10 seconds. Check:
```bash
docker compose ps
```

Both `postgres` and `redis` should say **running**.

### Step A5 — Install packages

```bash
pnpm install
```

This may take 2–5 minutes the first time.

### Step A6 — Set up the database

Run these **one at a time**:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

- `generate` — prepares database code  
- `migrate:deploy` — creates tables  
- `seed` — adds demo café, owner account, sample plans  

### Step A7 — Start the apps

```bash
pnpm dev
```

Keep this terminal open. You should see API on port **3001** and web on port **3000**.

### Step A8 — Open in browser

| URL | What it is |
|-----|------------|
| http://localhost:3000/login | Owner login |
| http://localhost:3001/health | API health check |
| http://localhost:3000/portal/downtown-cafe | Customer WiFi portal (demo) |

**Demo login:**

| Role | Email | Password |
|------|-------|----------|
| Venue owner | `owner@demo.com` | `password123` |
| Platform admin | `admin@platform.com` | `password123` |

✅ **Local install done** when you can log in and see the dashboard.

### Step A9 — (Optional) Run gateway agent locally

Open a **second terminal**:

```bash
pnpm gateway:dev
```

This uses **mock** mode (logs only, no real router). Good for testing.

---

## Part B — Use the app locally

### Owner workflow (5 minutes)

1. Login at http://localhost:3000/login as `owner@demo.com`
2. Go to **Wi-Fi Plans** — see demo plans (Free, Basic, etc.)
3. Go to **Vouchers** — click create/generate a voucher
4. Open captive portal: http://localhost:3000/portal/downtown-cafe
5. Enter the voucher code → you should see "connected"
6. Go to **Sessions** — your test session should appear

### Run automated test

With `pnpm dev` running, open another terminal:

```bash
pnpm test:e2e
```

All tests should pass (green).

---

## Part C — Prepare for production (real business)

Before uploading to a server, prepare:

### C1 — Buy a domain

Example: `mywifiservice.com` from Namecheap, Cloudflare, Google Domains, etc.

### C2 — Buy a VPS

Recommended providers for beginners:

- [DigitalOcean](https://www.digitalocean.com) — "Droplet" Ubuntu 24.04, $6/mo
- [Linode](https://www.linode.com)
- [Vultr](https://www.vultr.com)

### C3 — Point domain to VPS

In your domain DNS settings, add:

| Type | Name | Value |
|------|------|-------|
| A | `@` | Your VPS IP (e.g. `203.0.113.50`) |
| A | `www` | Same IP |

Wait 5–30 minutes. Test: `ping mywifiservice.com`

### C4 — Create production zip (on your PC)

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File deploy/make-packages.ps1
```

**Linux/Mac:**
```bash
bash deploy/make-packages.sh
```

This creates:
- `deploy/production-cloud.zip` — upload to VPS
- `deploy/gateway-venue.zip` — for venue router later

### C5 — Generate strong secrets

On your PC or VPS:

```bash
openssl rand -hex 32
```

Run **three times** — use for `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

---

## Part D — Deploy to a VPS (cloud server)

### Step D1 — Connect to your VPS

**Windows:** Use [PuTTY](https://www.putty.org) or Windows Terminal:

```bash
ssh root@YOUR_VPS_IP
```

### Step D2 — Install Docker on VPS

```bash
curl -fsSL https://get.docker.com | sh
docker compose version
```

### Step D3 — Upload project zip

**From your PC** (replace IP and path):

```bash
scp deploy/production-cloud.zip root@YOUR_VPS_IP:/root/
```

Or use **FileZilla** / **WinSCP** to upload the zip to `/root/`.

### Step D4 — Unzip on VPS

```bash
cd /root
unzip production-cloud.zip -d wifi-saas
cd wifi-saas
```

If `unzip` is missing: `apt update && apt install -y unzip`

### Step D5 — Configure environment

```bash
cp .env.production.example .env
nano .env
```

Edit these values (use your real domain and secrets):

```bash
POSTGRES_PASSWORD=paste-random-secret-1
DATABASE_URL=postgresql://postgres:paste-random-secret-1@postgres:5432/sub_based_internet

JWT_SECRET=paste-random-secret-2
JWT_REFRESH_SECRET=paste-random-secret-3

WEB_URL=https://mywifiservice.com
NEXT_PUBLIC_API_URL=https://mywifiservice.com
```

Save in nano: `Ctrl+O`, Enter, `Ctrl+X`

### Step D6 — Deploy

```bash
bash deploy/setup-production.sh
```

First time with demo data:
```bash
SEED=1 bash deploy/setup-production.sh
```

Wait 3–10 minutes for Docker to build. When done:

```bash
bash deploy/verify-production.sh http://YOUR_VPS_IP
```

Or with domain after DNS works:
```bash
bash deploy/verify-production.sh https://mywifiservice.com
```

### Step D7 — Open firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

✅ **Production base deploy done** when `/health` returns OK in browser.

---

## Part E — Add HTTPS (secure padlock)

Browsers need **HTTPS** for production. Use free **Let's Encrypt** certificates.

### Step E1 — Install certbot

```bash
apt install -y certbot
```

### Step E2 — Stop nginx temporarily, get certificate

```bash
cd /root/wifi-saas
docker compose -f docker-compose.prod.yml stop nginx
certbot certonly --standalone -d mywifiservice.com -d www.mywifiservice.com
```

Follow prompts (enter email, agree to terms).

### Step E3 — Copy certificates

```bash
mkdir -p deploy/certs
cp /etc/letsencrypt/live/mywifiservice.com/fullchain.pem deploy/certs/
cp /etc/letsencrypt/live/mywifiservice.com/privkey.pem deploy/certs/
```

### Step E4 — Enable HTTPS in nginx

1. Open `deploy/nginx-ssl.conf.example` — copy the `443` server block into `deploy/nginx.conf`
2. Replace `your-domain.com` with your domain
3. Uncomment cert volume in `docker-compose.prod.yml`:
   ```yaml
   - ./deploy/certs:/etc/nginx/certs:ro
   ```
4. Add port `443:443` under nginx ports

Restart:
```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

Test: open `https://mywifiservice.com` — padlock should show.

**Detailed SSL steps:** see [production-deploy.md](./production-deploy.md)

---

## Part F — Stripe payments (optional)

Skip this if you manage licenses manually via `/admin`.

### Quick steps

1. Create account at [stripe.com](https://stripe.com)
2. Create 3 monthly products: Starter ($20), Business ($79), Enterprise ($199)
3. Copy each **Price ID** (`price_...`)
4. Developers → API keys → copy **Secret key**
5. Developers → Webhooks → add `https://mywifiservice.com/billing/webhook`
6. Add to `.env` on VPS:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_STARTER=price_...
   STRIPE_PRICE_BUSINESS=price_...
   STRIPE_PRICE_ENTERPRISE=price_...
   ```
7. Restart API: `docker compose -f docker-compose.prod.yml up -d api`
8. Test: login as owner → Billing → Subscribe (card `4242 4242 4242 4242`)

**Full guide:** [stripe-live-setup.md](./stripe-live-setup.md)

---

## Part G — Connect a venue router (Wi-Fi)

This runs **at the café/hotel**, not on your VPS.

### What you need at the venue

- OpenWRT router (or Raspberry Pi on same network)
- Gateway key from dashboard → **Devices**
- Location slug (e.g. `downtown-cafe`)

### Step G1 — Upload gateway zip

Copy `deploy/gateway-venue.zip` to a Raspberry Pi at the venue. Unzip and run:

```bash
sudo bash deploy/install-gateway-agent.sh
```

### Step G2 — Configure gateway

```bash
sudo nano /etc/wifi-saas/gateway.env
```

Set:
```bash
GATEWAY_API_URL=https://mywifiservice.com
GATEWAY_KEY=paste-from-dashboard-devices-page
GATEWAY_DRIVER=openwrt
GATEWAY_LAN_DEV=br-lan
GATEWAY_FAIL_FAST=1
```

Restart:
```bash
sudo systemctl restart wifi-saas-gateway
```

### Step G3 — Captive portal on router

Copy `deploy/nodogsplash.uci.example` settings to router `/etc/config/nodogsplash`.

Change redirect URL to:
```text
https://mywifiservice.com/portal/YOUR-SLUG?mac=$clientmac&ip=$clientip
```

Restart nodogsplash on router.

### Step G4 — Test at venue

1. Connect phone to guest WiFi
2. Browser should open portal
3. Redeem voucher
4. Internet works
5. Dashboard → Devices shows **Gateway online**
6. Dashboard → Sessions shows active user

**Full guide:** [openwrt-venue-pilot.md](./openwrt-venue-pilot.md)

---

## Part H — Go-live checklist

Before real customers use the system:

### Security
- [ ] Changed default passwords (`owner@demo.com`, `admin@platform.com`)
- [ ] Strong `JWT_SECRET` and `POSTGRES_PASSWORD` in production `.env`
- [ ] HTTPS working (padlock in browser)
- [ ] Firewall: only ports 22, 80, 443 open

### Cloud
- [ ] `https://your-domain.com/health` returns OK
- [ ] Owner can login and create vouchers
- [ ] Portal loads at `/portal/{slug}`
- [ ] `bash deploy/verify-production.sh` passes

### Billing (if using Stripe)
- [ ] Webhook endpoint shows 200 in Stripe dashboard
- [ ] Test subscription completes successfully

### Venue
- [ ] Gateway heartbeat visible in Devices page
- [ ] Voucher redeem → session → internet works
- [ ] Expired voucher is rejected
- [ ] Speed limit roughly matches plan

### Backups
- [ ] Know how to backup database (see [production-deploy.md](./production-deploy.md))

---

## Troubleshooting for beginners

### "pnpm is not recognized"
Install Node.js, then: `npm install -g pnpm`. Restart terminal.

### "docker is not recognized"
Install Docker Desktop (Windows/Mac) or Docker on Linux. Start Docker Desktop before commands.

### API won't start — Redis version error
Use Docker Redis (`docker compose up -d`). Set `REDIS_URL=redis://localhost:6379` in `.env`. Do not use old Windows Redis 3.x.

### "API not reachable" during E2E test
Run `pnpm dev` first and keep it running.

### Blank page after deploy
Check logs: `docker compose -f docker-compose.prod.yml logs web api`
Often `NEXT_PUBLIC_API_URL` is wrong — must match your public domain, then rebuild web.

### Portal works but no internet at venue
Gateway agent not running or wrong `GATEWAY_KEY`. Check `systemctl status wifi-saas-gateway`.

### Can't upload to htdocs
This project doesn't support htdocs. Use a VPS with Docker (Part D).

### Forgot admin password
Use platform admin at `/admin` or reset via database (ask your developer).

---

## Quick reference

### Local commands
```bash
docker compose up -d          # Start DB + Redis
pnpm install                # Install packages
pnpm db:migrate:deploy      # Update database
pnpm db:seed                # Demo data
pnpm dev                    # Start API + web
pnpm gateway:dev            # Gateway (mock)
pnpm test:e2e               # Run tests
```

### Production commands (on VPS)
```bash
bash deploy/setup-production.sh
SEED=1 bash deploy/setup-production.sh
bash deploy/verify-production.sh https://your-domain.com
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml up -d
```

### Important URLs (replace domain)
| URL | Purpose |
|-----|---------|
| `https://your-domain.com/login` | Owner login |
| `https://your-domain.com/admin` | Platform admin |
| `https://your-domain.com/portal/SLUG` | Customer WiFi portal |
| `https://your-domain.com/health` | API health |

### Zip files
| File | Upload to |
|------|-----------|
| `deploy/production-cloud.zip` | VPS server |
| `deploy/gateway-venue.zip` | Venue router / Pi |

### More detailed docs
| Topic | Document |
|-------|----------|
| Production deploy details | [production-deploy.md](./production-deploy.md) |
| OpenWRT venue pilot | [openwrt-venue-pilot.md](./openwrt-venue-pilot.md) |
| Stripe billing | [stripe-live-setup.md](./stripe-live-setup.md) |
| What to upload | [../../deploy/WHAT-TO-UPLOAD.md](../../deploy/WHAT-TO-UPLOAD.md) |
| API reference | [api-contracts.md](./api-contracts.md) |

---

**You are production-ready when:** HTTPS works, owner can create vouchers, customers can redeem at the portal, and the venue gateway shows online in Devices.
