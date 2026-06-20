# Task: E2E Tests & README

- **ID:** 008
- **Status:** completed
- **Sprint:** 5
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Write E2E happy-path test and root README with local dev and deployment instructions.

## Acceptance Criteria

- [x] E2E test: generate voucher → redeem via portal → session in dashboard → gateway poll
- [x] Root `README.md` with setup, env vars, dev commands
- [x] All task docs 001–007 in `output/completed/`
- [x] `output/TASKS.md` reflects all tasks completed

## Files Touched

- `e2e/happy-path.e2e.ts` — Vitest integration test (7 steps + double-redeem guard)
- `vitest.config.ts` — E2E test runner config
- `package.json` — `test:e2e`, `test:e2e:watch`, vitest devDependency
- `README.md` — full setup, env table, scripts, E2E, deployment overview
- `.github/workflows/e2e.yml` — CI workflow (Postgres + Redis + API + E2E)
- `output/TASKS.md` — all 9 tasks marked completed

## Notes / Decisions

- E2E runs against a **live API** (not in-process Nest) so it matches real HTTP behavior including Redis locks and gateway auth.
- Uses seed data (`owner@demo.com`, `downtown-cafe`, `dev-gateway-key-downtown`).
- CI starts API after `pnpm build`; local dev runs `pnpm dev` then `pnpm test:e2e` in a second terminal.
- Double-redeem assertion included as bonus coverage beyond the happy path.

## Verification

```bash
docker compose up -d
pnpm install
pnpm db:generate && pnpm db:migrate:deploy && pnpm db:seed
pnpm dev          # terminal 1
pnpm test:e2e     # terminal 2
```

Re-verified 2026-06-20: all 7 E2E steps pass against live API on `:3001`.
