# Task: Platform Admin UI

- **ID:** 012
- **Status:** completed
- **Sprint:** 7
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Minimal `/admin` UI for platform admins: tenant list, create tenant, update plan and license status.

## Acceptance Criteria

- [x] `/admin` route protected for `PLATFORM_ADMIN` role only
- [x] Tenant list with location/user counts
- [x] Create tenant form (name, plan, license, optional owner credentials)
- [x] Update tenant plan and license status
- [x] Login redirects platform admin to `/admin`, owners to `/dashboard`
- [x] API client methods for `/tenants`

## Files Touched

- `apps/web/src/app/admin/layout.tsx`, `page.tsx`
- `apps/web/src/components/admin/AdminShell.tsx`, `TenantsPage.tsx`
- `apps/web/src/lib/api-client.ts`, `auth-redirect.ts`
- `apps/web/src/types/admin.ts`
- `apps/web/src/components/auth/LoginForm.tsx`
- `apps/web/src/components/dashboard/DashboardShell.tsx`
- `apps/web/src/hooks/useAuth.tsx`
- `README.md`

## Notes / Decisions

- Reuses dashboard shell CSS; separate `AdminShell` with platform branding.
- Inline plan/license selects with Save per row (dirty-state detection).
- Removed stray debug telemetry from `useAuth` and `api-client`.

## Verification

```bash
pnpm dev
# Login: admin@platform.com / password123 → http://localhost:3000/admin
# Create tenant, change plan/license, save
```
