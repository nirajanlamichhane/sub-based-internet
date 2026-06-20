# Frontend Conventions (Next.js)

## Page Structure

App Router pages in `apps/web/src/app/` are **thin** — they import and render feature components.

```tsx
// app/dashboard/vouchers/page.tsx — GOOD (thin)
import { VoucherList } from '@/components/vouchers/VoucherList';

export default function VouchersPage() {
  return <VoucherList />;
}
```

Business logic belongs in hooks (`hooks/`) or feature components (`components/{feature}/`).

## Component Organization

```text
components/
├── ui/                     # Button, Input, Card, Table — no feature logic
├── dashboard/              # Dashboard-specific layout and widgets
├── vouchers/               # VoucherList, VoucherForm, QrPrintView
├── sessions/               # SessionTable, SuspendButton
└── portal/                 # Captive portal screens
```

## CSS Rules

- All styles in `apps/web/src/css/` — global or CSS modules.
- File naming: `feature-name.module.css` for scoped, `globals.css` for global.
- No large inline `style={{}}` blocks — use CSS modules.
- Tailwind utility classes are allowed in JSX when scaffolded (task 001).

```tsx
import styles from '@/css/voucher-card.module.css';

export function VoucherCard() {
  return <div className={styles.card}>...</div>;
}
```

## Scripts

Non-React utilities (formatters, client-side validators) go in `apps/web/src/script/`.

Do not duplicate `packages/shared/utils` — import from shared when available.

## API Calls

All HTTP requests go through `apps/web/src/lib/api-client.ts`.

```typescript
// lib/api-client.ts
export const apiClient = {
  vouchers: {
    list: () => fetchJson('/vouchers'),
    redeem: (data: RedeemPayload) => fetchJson('/vouchers/redeem', { method: 'POST', body: data }),
  },
};
```

Pages and components never call `fetch` directly.

## Hooks

Extract reusable stateful logic:

- `useVouchers()` — fetch and cache voucher list
- `useSession()` — auth session state
- `useRedeemVoucher()` — redeem flow with loading/error states

## Types

- Shared types: import from `@sub-based-internet/shared/types`
- Web-only types: `apps/web/src/types/`

## Captive Portal

Public routes under `app/portal/[locationSlug]/` — no dashboard layout wrapper.

Pass MAC address via query param `?mac=` (from router redirect).

## Assets

Static files in `apps/web/src/assets/` or `public/` (images, fonts).
