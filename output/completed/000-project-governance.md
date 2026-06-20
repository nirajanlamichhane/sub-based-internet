# Task: Project Governance

- **ID:** 000
- **Status:** completed
- **Sprint:** 0
- **Started:** 2026-06-19
- **Completed:** 2026-06-19

## Goal

Establish project rules in `/rules` and task tracking in `/output` before any application code is written.

## Acceptance Criteria

- [x] `rules/` folder with 8 rule files (README, standards, folder structure, DRY, docs, API, frontend, security)
- [x] `output/TASKS.md` master board with all tasks 000–008 listed
- [x] `output/pending/` with task docs 001–008
- [x] `output/completed/` with this task doc
- [x] `output/architecture/` with data-model, api-contracts, gateway-protocol drafts
- [x] `.cursor/rules/` IDE mirror entries referencing `/rules`
- [x] Build gate documented: no `apps/` code until this task is complete

## Files Touched

- `rules/README.md`
- `rules/project-standards.md`
- `rules/folder-structure.md`
- `rules/code-reuse.md`
- `rules/documentation.md`
- `rules/api-conventions.md`
- `rules/frontend-conventions.md`
- `rules/security.md`
- `output/TASKS.md`
- `output/architecture/data-model.md`
- `output/architecture/api-contracts.md`
- `output/architecture/gateway-protocol.md`
- `output/pending/001-scaffold-monorepo.md` through `008-e2e-docs.md`
- `.cursor/rules/project-governance.mdc`
- `.cursor/rules/folder-structure.mdc`
- `.cursor/rules/code-reuse.mdc`

## Notes / Decisions

- Source of truth for rules is `rules/` folder; `.cursor/rules/` mirrors key rules for IDE enforcement.
- Architecture docs are living drafts — updated as implementation progresses.
- Task 001 (scaffold monorepo) is next.

## Verification

1. Confirm `rules/` contains 8 markdown files.
2. Confirm `output/TASKS.md` shows 1 completed, 8 pending.
3. Confirm `output/pending/` has 8 task files (001–008).
4. Confirm `output/completed/000-project-governance.md` exists.
5. Confirm `output/architecture/` has 3 draft docs.
6. Read `rules/README.md` — index links to all rule files.
