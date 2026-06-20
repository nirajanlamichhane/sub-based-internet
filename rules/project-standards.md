# Project Standards

## Language & Tooling

- **TypeScript** everywhere — `strict: true` in all `tsconfig.json` files.
- **Package manager:** pnpm (workspace monorepo).
- **Formatter:** Prettier (configured at repo root when scaffolded).
- **Linter:** ESLint with TypeScript and framework plugins.

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `VoucherCard.tsx` |
| Files (modules/utils) | kebab-case | `voucher.service.ts` |
| Folders | kebab-case | `wifi-plans/` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_SESSION_DURATION` |
| Types/Interfaces | PascalCase | `WifiSession` |
| Enums | PascalCase members | `VoucherStatus.REDEEMED` |
| API routes | kebab-case plural | `/wifi-plans`, `/vouchers/redeem` |
| Env variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

## Environment Variables

- Never commit `.env` files.
- Provide `.env.example` at repo root and per app when scaffolded.
- Load env only in config modules (`apps/api/src/config/`), not scattered in services.

## Git & Commits

- Commit only when explicitly requested.
- Message format: imperative mood, focus on *why*.
  - Good: `Add voucher redeem lock to prevent double redemption`
  - Bad: `fix stuff`, `WIP`

## Dependencies

- Prefer workspace packages (`@sub-based-internet/shared`) over duplicating code.
- Add dependencies only to the package that uses them (not always at root).
- Pin major versions; avoid unnecessary packages.

## Error Handling

- API: use NestJS exception filters; return consistent error shape (see `api-conventions.md`).
- Web: surface user-friendly messages; log details to console in dev only.
- Never swallow errors silently.

## Testing

- Unit tests colocated or in `__tests__/` next to source.
- E2E tests in dedicated `e2e/` folder per app (added in task 008).
