# Task: Scaffold Monorepo

- **ID:** 001
- **Status:** completed
- **Sprint:** 1
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Initialize pnpm + Turborepo monorepo with app shells, Docker Compose (Postgres + Redis), and folder structure per `rules/folder-structure.md`.

## Acceptance Criteria

- [x] Root `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- [x] `apps/web/` — Next.js 15 + TypeScript + Tailwind (empty shell)
- [x] `apps/api/` — NestJS + TypeScript (empty shell with `/health`)
- [x] `packages/shared/` — package with `constants/`, `validators/`, `types/`, `utils/` folders
- [x] `packages/db/` — Prisma package shell
- [x] `gateway/agent/` — package shell with `drivers/`, `script/`, `types/`, `utils/`
- [x] `docker-compose.yml` — PostgreSQL + Redis
- [x] `.env.example` at repo root
- [x] `pnpm dev` scripts configured (web :3000, api :3001)
- [x] Folder layout matches `rules/folder-structure.md` (css/, script/, etc.)

## Files Touched

- Root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`
- `apps/web/` — Next.js 15, Tailwind, App Router, `css/`, `lib/api-client.ts`, `components/ui/Button.tsx`
- `apps/api/` — NestJS with HealthModule at `GET /health`
- `packages/shared/` — Zod validator shell, constants, utils
- `packages/db/` — Prisma placeholder schema
- `gateway/agent/` — MockDriver, config loader, heartbeat loop stub

## Notes / Decisions

- Package scope: `@sub-based-internet/*`
- API port 3001, web port 3000
- Shared package uses workspace protocol (`workspace:*`)
- Web imports shared via `transpilePackages` in `next.config.ts`
- Runtime verification (`pnpm install`, `docker compose`) requires full Node.js + pnpm + Docker on host machine (not available in Cursor sandbox shell)

## Verification

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm dev
```

- Web: http://localhost:3000 — home page with app title
- API: http://localhost:3001/health — `{ "status": "ok", "timestamp": "..." }`
- Gateway: `pnpm gateway:dev` — mock heartbeat logs
