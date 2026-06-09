#!/usr/bin/env bash
set -euo pipefail
docker compose exec api pnpm --filter @thedigihubs/database prisma:push
docker compose exec api pnpm --filter @thedigihubs/database prisma:seed
