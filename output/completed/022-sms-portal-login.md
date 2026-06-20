# Task: SMS Login on Captive Portal

- **ID:** 022
- **Status:** completed
- **Sprint:** 9
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Phone OTP login on captive portal as alternative to voucher codes.

## Acceptance Criteria

- [x] `POST /portal/sms/send`, `POST /portal/sms/verify`
- [x] OTP stored in Redis; creates `WifiSession` on verify
- [x] Dev mode logs OTP to API console
- [x] Portal UI: `SmsStep` + link from voucher step

## Files Touched

- `apps/api/src/modules/portal-auth/`
- `packages/shared/src/validators/portal-sms.ts`
- `apps/web/src/components/portal/SmsStep.tsx`, `PortalPage.tsx`

## Verification

Portal → Sign in with phone → dev code in API logs → verify → success screen.
