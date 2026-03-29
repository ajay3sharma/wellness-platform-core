# wellness-platform-core

Brand-neutral monorepo for a white-label fitness and wellness platform.

The technical workspace stays neutral, while the first brand pack is `MoveYOU` with the tagline `Stretch. Strengthen. Renew.`. Product naming, theme tokens, billing defaults, AI quota defaults, domains, and app metadata all resolve through shared configuration instead of feature-level hardcoding.

## Current Bootstrap

- `apps/web` is a Next.js consumer web scaffold
- `apps/admin` is a Next.js admin and coach portal scaffold
- `apps/mobile` is an Expo + Expo Router mobile scaffold
- `apps/api` is a NestJS API scaffold with auth and health routes
- `packages/*` hold shared brand, config, types, billing, AI, SDK, and UI helpers
- `.codex/skills/platform-project` is the repo-owned lean skill for future Codex sessions

## Workspace Layout

- `apps/mobile`: mobile consumer app scaffold with Expo Router tabs and auth placeholder
- `apps/web`: consumer website scaffold for landing, login, account, and store
- `apps/admin`: admin and coach portal scaffold for dashboard, users, content, and login
- `apps/api`: NestJS backend scaffold with `/api/v1/health` and auth endpoints
- `packages/brand`: brand registry and the first `MoveYOU` brand pack
- `packages/types`: shared platform contracts
- `packages/config`: deployment and platform defaults
- `packages/billing`: market-aware billing provider resolution
- `packages/ai`: free-tier-only AI quota policy helpers
- `packages/sdk`: typed API client and endpoint contracts
- `packages/ui`: shared UI token helpers for the clay-inspired design system
- `.codex/skills/platform-project`: repo-owned lean project skill for Codex sessions

## Local Development

First-time setup:

- `corepack pnpm install`
- `Copy-Item .env.example .env`

Start everything:

- `corepack pnpm dev`

Start one surface at a time:

- `corepack pnpm dev:web`
- `corepack pnpm dev:admin`
- `corepack pnpm dev:api`
- `corepack pnpm dev:mobile`

Default local URLs:

- web: `http://localhost:3000`
- admin: `http://localhost:3001`
- api: `http://localhost:4000/api/v1/health`
- mobile Metro: `http://localhost:8081`

Quick API login test:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri 'http://localhost:4000/api/v1/auth/login' `
  -ContentType 'application/json' `
  -Body '{"email":"support@moveyou.app","password":"dev-password"}'
```

## Validation Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`
- `corepack pnpm format`

## Current Scaffolded Routes

- web: `/`, `/login`, `/account`, `/store`
- admin: `/`, `/login`, `/dashboard`, `/users`, `/content`
- api: `GET /api/v1/health`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- mobile: auth entry plus tabs for home, workouts, reset, progress, and store

## Platform Defaults

- Repo slug: `wellness-platform-core`
- Default branch: `main`
- Billing: Razorpay for India, Stripe for global markets
- AI: free-tier-only, best effort, graceful disable on quota exhaustion
- Branding: multi-brand per deployment
- Auth scaffold: custom JWT + Prisma + Postgres

## Git Workflow

- Use `main` as the default branch
- Use `codex/*` for feature branches
- Keep brand-facing strings inside `packages/brand`

More detail lives in [docs/architecture.md](./docs/architecture.md).
