# What to Upload / Deploy

> **New user?** Read the full beginner guide first: [installation-production-guide.md](../output/architecture/installation-production-guide.md)

This project is **not a PHP/htdocs app**. You cannot copy a single folder into Apache `htdocs` and expect it to work.

| Component | Technology | Where it runs |
|-----------|------------|---------------|
| Dashboard + portal | Next.js (Node) | VPS with Docker, or Node.js server |
| API | NestJS (Node) | Same VPS (Docker) |
| Database | PostgreSQL | Docker or managed DB |
| Gateway agent | Node on router/Pi | Venue LAN (OpenWRT sidecar) |

## Zip packages (in `deploy/`)

| Zip | Use when |
|-----|----------|
| **`production-cloud.zip`** | Deploying the **cloud stack** on a Linux VPS (Docker) |
| **`gateway-venue.zip`** | Installing the **gateway agent** at a venue (router/Pi) |

---

## production-cloud.zip — contents

Upload to your VPS, unzip, then:

```bash
cp .env.production.example .env
# edit .env
bash deploy/setup-production.sh
```

Includes:

```
apps/api/              # NestJS API source
apps/web/              # Next.js web source
packages/db/           # Prisma schema + migrations
packages/shared/       # Shared types/validators
deploy/                # nginx, scripts, gateway templates
docker-compose.prod.yml
Dockerfile.api
Dockerfile.web
.dockerignore
.env.production.example
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
README.md
```

**Not included** (rebuilt on server): `node_modules`, `.next`, `dist`, `.git`

---

## gateway-venue.zip — contents

Copy to venue sidecar (Raspberry Pi) or OpenWRT with Node:

```bash
sudo bash deploy/install-gateway-agent.sh
```

Includes:

```
gateway/agent/         # Gateway daemon + OpenWRT scripts
packages/shared/       # Shared dependency
deploy/gateway-agent.env.example
deploy/gateway-agent.service
deploy/gateway-agent.procd
deploy/nodogsplash.uci.example
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
```

---

## If you only have shared hosting (cPanel / htdocs)

Shared hosting with **htdocs only** cannot run this stack. You need:

- A **VPS** (DigitalOcean, Linode, AWS EC2, etc.) with Docker, **or**
- Split deploy: API on Railway/Render + Web on Vercel (requires config changes)

See [output/architecture/production-deploy.md](../output/architecture/production-deploy.md).

---

## Regenerate zips

```bash
bash deploy/make-packages.sh
```

On Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File deploy/make-packages.ps1
```
