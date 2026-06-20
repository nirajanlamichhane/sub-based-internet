# Documentation Standards

All project work is tracked in the `output/` folder.

## Folder Roles

| Folder | Purpose |
|--------|---------|
| `output/TASKS.md` | Master board — summary table and links |
| `output/pending/` | Tasks not yet started |
| `output/in-progress/` | Active tasks with daily notes |
| `output/completed/` | Finished tasks with verification steps |
| `output/architecture/` | Living technical docs (data model, API, gateway) |

## Task Lifecycle

1. **Create** task doc in `output/pending/NNN-task-name.md` before work begins.
2. **Start** — move file to `output/in-progress/` and update `TASKS.md`.
3. **Log** decisions and blockers in the task doc's Notes section during work.
4. **Complete** — move to `output/completed/`, fill Verification section, update `TASKS.md`.

## Task Doc Template

```markdown
# Task: [title]

- **ID:** NNN
- **Status:** pending | in-progress | completed
- **Sprint:** N
- **Started:** YYYY-MM-DD
- **Completed:** YYYY-MM-DD

## Goal
[What this task delivers]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Files Touched
- path/to/file

## Notes / Decisions
[Updated during in-progress]

## Verification
[How to test — required on completion]
```

## TASKS.md Updates

Update `output/TASKS.md` whenever:

- A task moves between pending / in-progress / completed
- Acceptance criteria change
- A blocker is resolved

## Architecture Docs

Update `output/architecture/` when:

- Prisma schema changes → `data-model.md`
- API endpoints added/changed → `api-contracts.md`
- Gateway protocol changes → `gateway-protocol.md`

Keep architecture docs in sync with implementation — do not let them drift.

## What Not to Document Here

- Do not create ad-hoc markdown files outside `output/` unless explicitly requested.
- README.md at repo root is allowed for setup instructions (task 008).
