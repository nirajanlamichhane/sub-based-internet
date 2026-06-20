# Security Rules

## Tenant Isolation

- Every API query must filter by `tenantId` from the authenticated user.
- `TenantGuard` validates the user belongs to the tenant on every protected route.
- Platform admin routes (`/admin/*`) use a separate `PlatformAdminGuard`.
- Integration tests must verify tenant A cannot access tenant B data.

## Authentication

- Owner dashboard: JWT access token + refresh token.
- Gateway: `X-Gateway-Key` per location (not JWT).
- Captive portal: public routes; voucher token is the customer credential.
- Never store passwords in plain text — bcrypt with cost factor ≥ 10.

## Voucher Security

- Tokens: cryptographically random, minimum 16 characters.
- **One-time redemption:** Redis `SETNX` lock + database status `REDEEMED`.
- **Expiry:** check `expiresAt` on redeem; background job marks `EXPIRED`.
- **MAC binding:** redeem requires client MAC address from captive portal.
- QR codes encode only the token — no PII in the QR payload.

## Gateway Security

- Each `Location` has a unique `gatewayKey`; rotate on compromise.
- All gateway ↔ cloud traffic over HTTPS in production.
- License check on every heartbeat; expired license returns empty session list.
- Gateway keys never appear in frontend code or logs.

## Secrets Management

- Secrets in environment variables only — never in source code.
- `.env` files are gitignored.
- `.env.example` documents required keys without real values.

## Audit Logging

Log these events to `AuditLog` table:

- Voucher created (batch or single)
- Voucher redeemed
- Session suspended
- Gateway key regenerated
- Tenant license status changed

## API Hardening

- Rate limit public endpoints (`/vouchers/redeem`, `/portal/*`).
- Validate all input via shared Zod schemas.
- CORS restricted to known frontend origin in production.
- No stack traces in production error responses.

## Customer Data

- Store minimum PII — MAC address and session metadata only for MVP.
- Mobile numbers (Phase 2) require explicit consent on captive portal.
