# Task: Captive Portal

- **ID:** 005
- **Status:** completed
- **Sprint:** 3
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Build public captive portal at `/portal/[locationSlug]` with voucher redeem, MAC binding, and session activation.

## Acceptance Criteria

- [x] Landing page: terms, voucher code entry
- [x] QR deep-link: `?token=ABC123` auto-redeem
- [x] MAC from query param `?mac=` bound on redeem
- [x] Success screen with session expiry countdown
- [x] Error states: invalid, expired, already-used voucher
- [x] Components in `components/portal/`, styles in `css/`

## Files Touched

- `apps/web/src/app/portal/[locationSlug]/page.tsx`
- `apps/web/src/components/portal/` — PortalPage, TermsStep, VoucherStep, SuccessView, ErrorView
- `apps/web/src/css/portal.module.css`
- `apps/web/src/hooks/useCountdown.ts`
- `apps/web/src/script/portal.ts`
- `apps/web/src/lib/api-client.ts` — `portal.lookupVoucher`, `portal.redeem`
- `apps/web/src/types/auth.ts` — RedeemResponse, VoucherLookup

## Notes / Decisions

- QR link format: `/portal/{slug}?token=XXX&mac=aa:bb:cc:dd:ee:ff&ip=...`
- Without `?mac=`, portal shows MAC input for local dev testing
- Auto-redeem after terms if token present and MAC available
- Friendly error messages via `mapRedeemError()`

## Verification

```bash
pnpm dev

# Manual redeem (get token from seed output or dashboard)
open "http://localhost:3000/portal/downtown-cafe?mac=aa:bb:cc:dd:ee:01"

# QR deep-link auto-redeem
open "http://localhost:3000/portal/downtown-cafe?token=YOUR_TOKEN&mac=aa:bb:cc:dd:ee:01"

# Verify session in dashboard → Sessions
```
