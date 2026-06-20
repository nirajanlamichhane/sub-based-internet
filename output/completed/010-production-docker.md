# Task: Production Docker Deployment

- **ID:** 010
- **Status:** completed
- **Sprint:** 6
- **Started:** 2026-06-20
- **Completed:** 2026-06-20

## Goal

Containerize API and web apps; add production compose stack with migrate init, env template, and nginx TLS reverse proxy.

## Acceptance Criteria

- [x] `Dockerfile.api` and `Dockerfile.web` multi-stage builds
- [x] `.dockerignore` for lean images
- [x] `docker-compose.prod.yml` — postgres, redis, migrate, api, web, nginx
- [x] `.env.production.example` with production vars
- [x] README deployment section updated

## Files Touched

- `Dockerfile.api`, `Dockerfile.web`, `.dockerignore`
- `docker-compose.prod.yml`, `deploy/nginx.conf`
- `.env.production.example`, `README.md`, `package.json`

## Notes / Decisions

- TLS terminates at nginx; mount certs via `./deploy/certs/` for production.
- `NEXT_PUBLIC_API_URL` baked at web image build time.

## Verification

```bash
cp .env.production.example .env
docker compose -f docker-compose.prod.yml up --build
curl http://localhost/health
```
