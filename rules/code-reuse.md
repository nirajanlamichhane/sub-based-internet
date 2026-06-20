# Code Reuse (DRY Policy)

**Do not loop in the same code.** If logic appears twice, extract it before continuing.

## Hierarchy of Reuse

1. `packages/shared/` — validators, types, constants, pure utils used by 2+ apps
2. App-level `utils/` or `lib/` — used only within that app
3. Feature module — used only within that feature

## Mandatory Shared Extractions

| Concern | Location | Never duplicate in |
|---------|----------|-------------------|
| Zod validation schemas | `packages/shared/validators/` | API DTOs and web forms separately |
| Enums and constants | `packages/shared/constants/` | Magic strings in components/services |
| DTO interfaces | `packages/shared/types/` | Inline types in controllers and pages |
| Date/duration formatting | `packages/shared/utils/` | Per-screen formatters |
| Token generation | `packages/shared/utils/` | Voucher service and scripts |
| API HTTP client | `apps/web/src/lib/api-client.ts` | Raw `fetch` in pages/components |
| Auth guards | `apps/api/src/common/guards/` | Per-module guard copies |
| UI primitives | `apps/web/src/components/ui/` | Rebuilt buttons/inputs per screen |

## Before Adding New Code

1. **Search** the codebase for existing implementations (`grep` or IDE search).
2. **Extend** the existing module if it fits.
3. **Extract** to `shared` if both web and API need it.
4. **Create new** only when no suitable home exists.

## Refactor Trigger

Refactor immediately when:

- The same 5+ lines appear in two files
- The same Zod schema or interface is defined twice
- The same API endpoint is called with duplicate error handling
- Two components render the same table/form structure

## Anti-Patterns (Forbidden)

```typescript
// BAD — duplicate validator in API and web
// apps/api/src/modules/vouchers/dto/redeem.dto.ts
// apps/web/src/components/portal/RedeemForm.tsx (inline zod)

// GOOD — single schema
import { redeemVoucherSchema } from '@sub-based-internet/shared/validators';
```

```typescript
// BAD — fetch in every page
const res = await fetch('/api/vouchers/redeem', { ... });

// GOOD — centralized client
import { apiClient } from '@/lib/api-client';
await apiClient.vouchers.redeem(payload);
```

```tsx
// BAD — large inline styles
<div style={{ padding: 16, background: '#fff', ... }}>

// GOOD — CSS module
import styles from '@/css/voucher-card.module.css';
<div className={styles.card}>
```

## Shared Package Rules

- No framework imports in `packages/shared` (no React, no NestJS).
- Only pure functions, types, constants, and Zod schemas.
- Export via explicit barrel files (`index.ts`) per subfolder.
