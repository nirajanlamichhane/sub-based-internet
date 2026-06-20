# Project Rules — Wi-Fi Subscription SaaS

All contributors (human and AI) must read and follow these rules before writing code.

## Rule Index

| File | When to read |
|------|--------------|
| [project-standards.md](./project-standards.md) | Before any file is created |
| [folder-structure.md](./folder-structure.md) | Before creating files or folders |
| [code-reuse.md](./code-reuse.md) | Before adding logic that may already exist |
| [documentation.md](./documentation.md) | Before starting or completing any task |
| [api-conventions.md](./api-conventions.md) | When working in `apps/api/` |
| [frontend-conventions.md](./frontend-conventions.md) | When working in `apps/web/` |
| [security.md](./security.md) | When handling auth, vouchers, tenants, or gateway keys |

## Core Principles

1. **No duplicate logic** — shared code lives in `packages/shared` or app-level `utils/`.
2. **File-type folders** — CSS in `css/`, scripts in `script/`, types in `types/`, etc.
3. **One task = one output doc** — track work in `output/pending/`, `in-progress/`, `completed/`.
4. **Update TASKS.md** — keep the master board current after every status change.

## Build Gate

No application code in `apps/` until task `000-project-governance` is in `output/completed/`.

## Cursor IDE

Mirrored rules live in `.cursor/rules/` for automatic IDE enforcement. Source of truth remains this `rules/` folder.
