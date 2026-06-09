#!/usr/bin/env bash
set -euo pipefail
node scripts/ensure-env.mjs
docker compose up --build
