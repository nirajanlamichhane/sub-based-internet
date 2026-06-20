# Task: Next.js Owner Dashboard

- **ID:** 004
- **Status:** completed
- **Sprint:** 2
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Implement owner dashboard screens: login, overview, plans, vouchers/QR, sessions, devices, reports, billing stub.

## Acceptance Criteria

- [x] Login page with JWT auth flow
- [x] Dashboard layout with navigation
- [x] Routes: `/dashboard`, `/dashboard/plans`, `/dashboard/vouchers`, `/dashboard/sessions`, `/dashboard/devices`, `/dashboard/reports`, `/dashboard/billing`
- [x] API client in `lib/api-client.ts` — no raw fetch in pages
- [x] CSS in `css/` folder per `rules/frontend-conventions.md`
- [x] Reusable UI primitives in `components/ui/`

## Files Touched

- `apps/web/src/lib/api-client.ts`, `auth-storage.ts`
- `apps/web/src/hooks/useAuth.tsx`, `useAsyncData.ts`
- `apps/web/src/components/ui/` — Button, Input, Card, Badge, Table
- `apps/web/src/components/dashboard/` — DashboardShell, OverviewPage
- `apps/web/src/components/{auth,plans,vouchers,sessions,devices,reports,billing}/`
- `apps/web/src/css/` — ui, dashboard, login modules
- `apps/web/src/app/login/`, `apps/web/src/app/dashboard/**`

## Notes / Decisions

- JWT stored in localStorage; `AuthProvider` wraps entire app
- Dashboard routes protected client-side via `DashboardShell`
- QR codes fetched as authenticated blob URLs
- Billing page is a static stub (Stripe in Phase 2)

## Verification

```bash
pnpm install
pnpm db:seed   # if not seeded
pnpm dev

# Open http://localhost:3000/login
# Login: owner@demo.com / password123
# Navigate all sidebar links
# Create plan, generate voucher, view QR, suspend session
```
