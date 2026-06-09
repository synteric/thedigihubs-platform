# TheDigiHubs

TheDigiHubs is a global B2B procurement marketplace where buyers discover suppliers, create RFQs, receive quotations, compare offers, and make award decisions through a clear digital workflow.

This starter is designed for local development with VS Code and Docker Desktop.

Package manager: this repository is a pnpm workspace. Use `pnpm` commands and keep `pnpm-lock.yaml` as the single committed lockfile.

## Stack

- Next.js web app
- NestJS API
- Prisma and PostgreSQL
- Redis
- Meilisearch
- MinIO
- Mailhog

## Run locally

```bash
pnpm setup
pnpm docker:up
```

Then run database setup:

```bash
pnpm docker:db:setup
```

## Build scripts

From VS Code, open **Terminal > Run Task** and choose a `TheDigiHubs:` task.

For a fresh checkout, run this first:

```bash
pnpm setup
```

This creates `.env` from `.env.example` if needed and installs dependencies. Without this step, local builds will fail because `next`, `nest`, and `tsc` are installed in `node_modules`.

From the terminal:

```bash
pnpm build
pnpm build:web
pnpm build:api
pnpm build:worker
pnpm typecheck
```

Docker shortcuts:

```bash
pnpm setup:env
pnpm docker:build
pnpm docker:up
pnpm docker:up:detached
pnpm docker:refresh
pnpm docker:web:refresh
pnpm docker:web:doctor
pnpm docker:bootstrap
pnpm docker:rebuild
pnpm db:doctor
pnpm docker:db:setup
pnpm docker:db:reset
pnpm docker:logs
pnpm docker:down
```

`pnpm docker:up` stays open and streams logs. Press `Ctrl+C` to stop the foreground process, or use `pnpm docker:up:detached` / `pnpm docker:bootstrap` when you want Docker to keep running in the background.

Use `pnpm docker:web:refresh` when the browser is still showing an old landing page. The dev Docker setup bind-mounts source folders while keeping container-installed dependencies intact, so this command recreates the API and web containers from existing local images without downloading packages again.

Use `pnpm docker:web:doctor` when `localhost:3000` does not connect. It starts shared services, recreates the app containers from existing local images, waits for the web app, and prints the web/API logs if the page still does not answer.

If Docker needs to rebuild images and npm registry/DNS is unavailable, wait until the connection to `registry.npmjs.org` is stable, then run `pnpm docker:refresh`.

Docker dev containers now bind-mount the source folder so UI/code changes appear in the running app after the service reloads. Use `pnpm docker:refresh` after package or compose changes.

Run `pnpm db:doctor` when Prisma reports invalid database credentials. It starts Docker Postgres if needed, reads `.env`, asks the running database whether those credentials work, and prints whether the role/database/password are valid or mismatched.

If Postgres reports invalid credentials during local setup on a fresh starter database, run `pnpm docker:db:reset`. This removes the local Docker Postgres volume for this project and recreates the seeded development database.

## URLs

- Web: http://localhost:3000
- API health: http://localhost:4000/api/health
- Mailhog: http://localhost:8025
- MinIO console: http://localhost:9001
- Meilisearch: http://localhost:7700

## DigitalOcean App Platform deployment

This monorepo must be built from the repository root in DigitalOcean. Do not set the source directory to `apps/web` or `apps/api`; those folders do not contain the root lockfiles or workspace configuration.

DigitalOcean production builds use the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Do not commit `package-lock.json`; it is not used by this pnpm workspace and can cause App Platform to report multiple lockfiles.

Use the production Dockerfiles at the repository root:

- Frontend Dockerfile path: `Dockerfile.web`
- Backend Dockerfile path: `Dockerfile.api`

Frontend component:

- Source repository: `synteric/thedigihubs-platform`
- Branch: `main`
- Source directory: blank or repository root
- Dockerfile path: `Dockerfile.web`
- HTTP port: `3000`
- Environment variables:
  - `NEXT_PUBLIC_API_URL=https://api.thedigihubs.com/api`
  - `NEXT_PUBLIC_APP_URL=https://www.thedigihubs.com`
  - `NODE_ENV=production`

Backend component:

- Source repository: `synteric/thedigihubs-platform`
- Branch: `main`
- Source directory: blank or repository root
- Dockerfile path: `Dockerfile.api`
- HTTP port: `4000`
- Environment variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `FRONTEND_URL=https://www.thedigihubs.com`
  - `WEB_ORIGIN=https://www.thedigihubs.com`
  - `NODE_ENV=production`
  - `PORT=4000`

The existing local Docker development files are still used by VS Code and Docker Compose:

- `docker-compose.yml`
- `apps/web/Dockerfile`
- `apps/api/Dockerfile`
- `apps/worker/Dockerfile`

## Auth and local access

After auth or schema changes, refresh the local database:

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
```

If you are running database commands from PowerShell against Docker Desktop, the Prisma helper automatically uses the host-mapped database at `127.0.0.1:55432`. Inside Docker, the hostname `postgres` remains correct.

Local seeded platform admin:

- Email: `support@thedigihubs.com`
- Password: set `PLATFORM_ADMIN_PASSWORD` before seeding, or use the local development seed password.

The API issues httpOnly session and refresh cookies from `/api/auth/login`. Protected app areas use the active organization, role, permissions, and plan returned by `/api/auth/me`.

Support and contact routing defaults to `support@thedigihubs.com` through `SUPPORT_EMAIL`, `CONTACT_EMAIL`, and `PLATFORM_ADMIN_EMAIL`. Public contact form submissions are recorded as admin support tickets and sent to the configured support inbox when mail is available. Registration and subscription request notifications also route to the same inbox.

## Key screens

- `/` — Marketplace homepage
- `/login` — Sign in
- `/contact` — Public contact form
- `/marketplace` — Supplier marketplace
- `/buyer` — Buyer dashboard
- `/supplier` — Supplier dashboard
- `/supplier/rfq/1098` — Supplier RFQ detail and prepare quote
- `/admin` — Admin analytics dashboard
- `/rfq/new` — RFQ creation workflow

## Design direction

The frontend uses a clean blue-and-white marketplace style with spacious sections, simple messaging, focused dashboards, and analytics shown only where it supports decisions.
