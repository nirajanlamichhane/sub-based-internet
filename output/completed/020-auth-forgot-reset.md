# Task: Owner Registration & Forgot Password

- **ID:** 020
- **Status:** completed
- **Sprint:** 9
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Self-service owner registration and password reset via email (SMTP or dev console log).

## Acceptance Criteria

- [x] `POST /auth/forgot-password`, `POST /auth/reset-password`
- [x] Redis token storage (1h TTL)
- [x] MailService with nodemailer + dev fallback
- [x] Web pages: `/register`, `/forgot-password`, `/reset-password`
- [x] Login links to register and forgot password

## Files Touched

- `apps/api/src/modules/auth/`, `apps/api/src/common/mail/`
- `packages/shared/src/validators/auth.ts`
- `apps/web/src/components/auth/`, `apps/web/src/app/register|forgot-password|reset-password/`

## Verification

Request forgot password for `owner@demo.com`; dev mode returns reset URL in response.
