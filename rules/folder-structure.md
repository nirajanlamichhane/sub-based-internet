# Folder Structure

Every file type has a dedicated folder. Do not mix concerns in a single file.

## Repository Root

```text
sub-based-internet/
├── rules/                  # Project rules (this folder)
├── output/                 # Task docs and architecture notes
├── apps/
│   ├── web/                # Next.js frontend
│   └── api/                # NestJS backend
├── packages/
│   ├── shared/             # Shared types, validators, constants, utils
│   └── db/                 # Prisma schema and client
├── gateway/
│   └── agent/              # Local gateway daemon
├── docker-compose.yml
├── turbo.json
└── README.md
```

## Web App (`apps/web/src/`)

| Folder | Contents | Do NOT put here |
|--------|----------|-----------------|
| `app/` | App Router pages — thin wrappers only | Business logic, large CSS blocks |
| `components/` | React components, grouped by feature | API calls (use `lib/`) |
| `components/ui/` | Reusable primitives (Button, Input, Table) | Feature-specific logic |
| `css/` | Global styles, CSS modules (`.css`, `.module.css`) | Inline styles in TSX |
| `hooks/` | Custom React hooks | Non-React utilities |
| `lib/` | API client, auth helpers, server actions | Generic formatters (use `shared`) |
| `script/` | Client-side JS utilities | React components |
| `types/` | Web-only TypeScript types | Types shared with API (use `shared`) |
| `assets/` | Images, fonts, icons | Code files |

## API (`apps/api/src/`)

| Folder | Contents | Do NOT put here |
|--------|----------|-----------------|
| `modules/{name}/` | Controller, service, module per feature | Cross-module DB access |
| `common/` | Guards, filters, interceptors, decorators | Feature-specific logic |
| `config/` | Environment and app configuration | Business rules |
| `script/` | Seed scripts, one-off migrations | Runtime application code |
| `types/` | API-only types | Shared DTOs (use `shared`) |
| `utils/` | Pure helpers with no NestJS deps | Services with DI |

### NestJS Module Layout

```text
modules/vouchers/
├── vouchers.module.ts
├── vouchers.controller.ts
├── vouchers.service.ts
└── dto/                    # Re-exports or thin wrappers around shared validators
```

## Shared Package (`packages/shared/src/`)

| Folder | Contents |
|--------|----------|
| `constants/` | Enums, plan tiers, speed presets |
| `validators/` | Zod schemas used by web and API |
| `types/` | DTOs and interfaces shared across apps |
| `utils/` | Pure functions (formatDuration, generateToken) |

## Gateway (`gateway/agent/src/`)

| Folder | Contents |
|--------|----------|
| `drivers/` | MockDriver, OpenWrtDriver |
| `script/` | Shell helpers, tc/iptables wrappers |
| `types/` | Gateway-specific types |
| `utils/` | Polling, config parsing |

## Rules When Adding Files

1. Check if the file type folder exists; create it if missing.
2. Place the file in the correct folder per this document.
3. If unsure, check `rules/code-reuse.md` before creating a parallel structure.
