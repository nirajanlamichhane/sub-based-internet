# Task Board — Wi-Fi Subscription SaaS

**Last updated:** 2026-06-20

## Summary

| Status | Count |
|--------|-------|
| Completed | 24 |
| In Progress | 0 |
| Pending | 0 |

## Tasks

| ID | Task | Status | Sprint | Doc |
|----|------|--------|--------|-----|
| 000–017 | *(see completed docs)* | completed | 0–8 | [completed/](./completed/) |
| 018 | Windows one-click setup | completed | 9 | [completed/018-windows-setup.md](./completed/018-windows-setup.md) |
| 019 | HTTPS auto-setup (Caddy) | completed | 9 | [completed/019-https-auto-setup.md](./completed/019-https-auto-setup.md) |
| 020 | Owner registration & forgot password | completed | 9 | [completed/020-auth-forgot-reset.md](./completed/020-auth-forgot-reset.md) |
| 021 | Nepal payments (eSewa / Khalti) | completed | 9 | [completed/021-nepal-payments.md](./completed/021-nepal-payments.md) |
| 022 | SMS login on captive portal | completed | 9 | [completed/022-sms-portal-login.md](./completed/022-sms-portal-login.md) |
| 023 | MikroTik gateway driver | completed | 9 | [completed/023-mikrotik-driver.md](./completed/023-mikrotik-driver.md) |

<details>
<summary>Full task list (000–017)</summary>

| ID | Task | Sprint |
|----|------|--------|
| 000 | Project governance | 0 |
| 001 | Scaffold monorepo | 1 |
| 002 | Prisma schema | 1 |
| 003 | NestJS core API | 1 |
| 004 | Next.js owner dashboard | 2 |
| 005 | Captive portal | 3 |
| 006 | Gateway agent | 4 |
| 007 | Jobs & security | 4 |
| 008 | E2E tests & README | 5 |
| 009 | OpenWRT driver | 6 |
| 010 | Production Docker | 6 |
| 011 | Stripe billing | 6 |
| 012 | Platform admin UI | 7 |
| 013 | OpenWRT pilot guide | 7 |
| 014 | Production deploy walkthrough | 7 |
| 015 | Stripe live setup guide | 8 |
| 016 | Deploy automation scripts | 8 |
| 017 | Installation & production guide | 8 |

</details>

## Architecture Docs

| Doc | Description |
|-----|-------------|
| [architecture/data-model.md](./architecture/data-model.md) | Database entities |
| [architecture/api-contracts.md](./architecture/api-contracts.md) | REST API |
| [architecture/gateway-protocol.md](./architecture/gateway-protocol.md) | Gateway agent |
| [architecture/installation-production-guide.md](./architecture/installation-production-guide.md) | **Beginner install & production guide (start here)** |
| [architecture/production-deploy.md](./architecture/production-deploy.md) | Production deploy |
| [architecture/openwrt-venue-pilot.md](./architecture/openwrt-venue-pilot.md) | Venue pilot |
| [architecture/stripe-live-setup.md](./architecture/stripe-live-setup.md) | Stripe billing setup |

## Go-Live Path

1. `bash deploy/setup-production.sh` on VPS (or `pnpm setup:windows` locally)
2. [stripe-live-setup.md](./architecture/stripe-live-setup.md) — configure billing
3. [openwrt-venue-pilot.md](./architecture/openwrt-venue-pilot.md) — venue hardware (OpenWRT or MikroTik)
