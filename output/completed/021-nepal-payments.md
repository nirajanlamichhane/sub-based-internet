# Task: Nepal Payments (eSewa / Khalti)

- **ID:** 021
- **Status:** completed
- **Sprint:** 9
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Local payment options for Nepal venues — eSewa form redirect and Khalti verify API.

## Acceptance Criteria

- [x] `Payment` Prisma model + migration
- [x] `POST /billing/nepal/initiate`, `POST /billing/nepal/khalti/verify`, `GET /billing/nepal/esewa/callback`
- [x] Billing dashboard section with eSewa/Khalti buttons
- [x] Env vars for merchant keys

## Files Touched

- `apps/api/src/modules/nepal-payments/`
- `packages/shared/src/validators/nepal-payment.ts`
- `packages/db/prisma/schema.prisma`
- `apps/web/src/components/billing/BillingPage.tsx`

## Verification

Owner initiates eSewa payment; pending `Payment` row created; callback marks complete and upgrades plan.
