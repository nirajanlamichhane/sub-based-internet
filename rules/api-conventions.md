# API Conventions (NestJS)

## Module Structure

Each feature gets one module under `apps/api/src/modules/{name}/`:

```text
modules/vouchers/
├── vouchers.module.ts      # Imports, providers, exports
├── vouchers.controller.ts  # HTTP layer only — no business logic
├── vouchers.service.ts     # Business logic and Prisma calls
└── dto/                    # Optional thin DTO classes wrapping shared validators
```

## Controller Rules

- Controllers delegate to services; no Prisma calls in controllers.
- Use decorators for auth: `@UseGuards(JwtAuthGuard, TenantGuard)`.
- Route prefix via `@Controller('vouchers')` — kebab-case, plural.

## Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Voucher already redeemed",
  "error": "Bad Request",
  "timestamp": "2026-06-19T12:00:00.000Z",
  "path": "/vouchers/redeem"
}
```

Use NestJS built-in exceptions: `BadRequestException`, `NotFoundException`, `ForbiddenException`, `UnauthorizedException`.

## DTO Validation

- Import Zod schemas from `@sub-based-internet/shared/validators`.
- Use a validation pipe or manual `schema.parse()` at service entry.
- Do not duplicate validation logic in controller and service.

## Multi-Tenant Queries

Every data query must scope by `tenantId` from the authenticated user context.

```typescript
// GOOD
await this.prisma.voucher.findMany({
  where: { location: { tenantId: user.tenantId } },
});

// BAD — missing tenant scope
await this.prisma.voucher.findMany({ where: { locationId } });
```

## Gateway Endpoints

Gateway routes use `X-Gateway-Key` header auth, not JWT:

- `POST /gateway/heartbeat`
- `GET /gateway/sessions`
- `POST /gateway/usage`

## Naming

| Item | Pattern |
|------|---------|
| Service methods | verb + noun: `createVoucher`, `redeemVoucher`, `suspendSession` |
| Controller methods | match HTTP verb: `create`, `findAll`, `redeem` |
| Module files | `{feature}.module.ts`, `{feature}.service.ts` |

## Scripts

One-off scripts (seed, migrate helpers) go in `apps/api/src/script/`, not in `main.ts` or modules.
