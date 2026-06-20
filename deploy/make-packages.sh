# Build production-cloud.zip and gateway-venue.zip (minimal deploy bundles)
# Usage: bash deploy/make-packages.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/deploy"
STAGING="$OUT/.pack-staging"
rm -rf "$STAGING"
mkdir -p "$STAGING/cloud" "$STAGING/gateway"

copy_tree() {
  local src="$1" dst="$2"
  mkdir -p "$dst"
  rsync -a \
    --exclude node_modules --exclude dist --exclude .next --exclude .turbo \
    --exclude '*.log' \
    "$src/" "$dst/"
}

echo "Building production-cloud.zip ..."
copy_tree "$ROOT/apps/api" "$STAGING/cloud/apps/api"
copy_tree "$ROOT/apps/web" "$STAGING/cloud/apps/web"
copy_tree "$ROOT/packages/db" "$STAGING/cloud/packages/db"
copy_tree "$ROOT/packages/shared" "$STAGING/cloud/packages/shared"
copy_tree "$ROOT/deploy" "$STAGING/cloud/deploy"
rm -f "$STAGING/cloud/deploy/production-cloud.zip" "$STAGING/cloud/deploy/gateway-venue.zip" 2>/dev/null || true

for f in docker-compose.prod.yml Dockerfile.api Dockerfile.web .dockerignore .env.production.example \
  package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json README.md; do
  cp "$ROOT/$f" "$STAGING/cloud/" 2>/dev/null || true
done

(cd "$STAGING/cloud" && zip -r "$OUT/production-cloud.zip" . -x "*.zip")

echo "Building gateway-venue.zip ..."
copy_tree "$ROOT/gateway/agent" "$STAGING/gateway/gateway/agent"
copy_tree "$ROOT/packages/shared" "$STAGING/gateway/packages/shared"
mkdir -p "$STAGING/gateway/deploy"
cp "$ROOT/deploy/gateway-agent.env.example" "$ROOT/deploy/gateway-agent.service" \
   "$ROOT/deploy/gateway-agent.procd" "$ROOT/deploy/nodogsplash.uci.example" \
   "$ROOT/deploy/install-gateway-agent.sh" "$STAGING/gateway/deploy/"
cp "$ROOT/package.json" "$ROOT/pnpm-lock.yaml" "$ROOT/pnpm-workspace.yaml" \
   "$ROOT/tsconfig.base.json" "$STAGING/gateway/"

(cd "$STAGING/gateway" && zip -r "$OUT/gateway-venue.zip" . -x "*.zip")

rm -rf "$STAGING"
echo "Done:"
ls -lh "$OUT/production-cloud.zip" "$OUT/gateway-venue.zip"
