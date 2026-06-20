# Task: Windows One-Click Setup

- **ID:** 018
- **Status:** completed
- **Sprint:** 9
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Single PowerShell script for Windows developers to install dependencies, copy env, migrate DB, and seed demo data.

## Acceptance Criteria

- [x] `scripts/setup-windows.ps1` checks Node, pnpm, Docker
- [x] Copies `.env.example` → `.env` if missing
- [x] Runs `pnpm install`, migrate, seed
- [x] Root `package.json` exposes `pnpm setup:windows`

## Files Touched

- `scripts/setup-windows.ps1`
- `package.json`

## Verification

Run `pnpm setup:windows` on Windows; script completes without manual steps.
