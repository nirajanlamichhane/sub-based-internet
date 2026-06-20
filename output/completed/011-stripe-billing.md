# Task: Stripe Billing Integration

- **ID:** 011
- **Status:** completed
- **Sprint:** 6
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Integrate Stripe Checkout + Customer Portal; sync subscription events to tenant plan and license status; wire billing dashboard.

## Acceptance Criteria

- [x] Prisma fields: stripeCustomerId, stripeSubscriptionId, subscriptionStatus, currentPeriodEnd
- [x] API billing module: subscription, checkout, portal, webhook
- [x] Webhook maps Stripe events → plan + licenseStatus
- [x] BillingPage shows live plan + upgrade/manage buttons
- [x] License check on voucher redeem
- [x] Env vars documented

## Files Touched

- `packages/db/prisma/schema.prisma`, migration `20250620120000_stripe_billing`
- `packages/shared/src/constants/billing.ts`, `validators/billing.ts`
- `apps/api/src/modules/billing/`
- `apps/api/src/config/env.ts`, `main.ts`, `app.module.ts`
- `apps/api/src/modules/vouchers/vouchers.service.ts`
- `apps/web/src/components/billing/BillingPage.tsx`, `lib/api-client.ts`
- `output/architecture/api-contracts.md`, `data-model.md`

## Notes / Decisions

- Without Stripe keys, subscription endpoint returns DB plan; checkout returns 503.
- Price IDs from env: STRIPE_PRICE_STARTER, STRIPE_PRICE_BUSINESS, STRIPE_PRICE_ENTERPRISE.

## Verification

```bash
pnpm db:migrate:deploy
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/billing/subscription
stripe listen --forward-to localhost:3001/billing/webhook
```
