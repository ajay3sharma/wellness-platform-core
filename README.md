# wellness-platform-core

Brand-neutral monorepo for a white-label fitness and wellness platform.

The technical workspace stays neutral, while the first brand pack is `MoveYOU` with the tagline `Stretch. Strengthen. Renew.`. Product naming, theme tokens, billing defaults, AI quota defaults, domains, and app metadata all resolve through shared configuration instead of feature-level hardcoding.

## Current Status

- Phase 0 shared foundation is complete
- Phase 1 auth, signup, fitness, and coach workspace is now runtime-validated across `apps/api`, `apps/admin`, and `apps/mobile`
- Phase 2 wellness is implemented and locally validated across `apps/api`, `apps/admin`, and `apps/mobile`
- Phase 3 commerce and subscriptions are implemented in code across `apps/api`, `apps/admin`, `apps/web`, and `apps/mobile`
- repo-level `lint`, `typecheck`, and `build` are green on the current Phase 3 branch baseline
- live Stripe and Razorpay acceptance still requires real provider credentials plus webhook delivery
- `packages/*` hold shared brand, config, types, billing, AI, SDK, and UI helpers
- `.codex/skills/platform-project` is the repo-owned project memory skill for future Codex sessions

## Workspace Layout

- `apps/mobile`: mobile consumer app with signup, login, workouts, session flow, and history
- `apps/web`: consumer website with live auth, store, account, and internal checkout bridge routes
- `apps/admin`: admin and coach portal with content, users, approvals, coaching workspace, and commerce workspace
- `apps/api`: NestJS backend with Prisma-backed auth, fitness, wellness, commerce, subscriptions, and billing webhook endpoints
- `packages/brand`: brand registry and the first `MoveYOU` brand pack
- `packages/types`: shared platform contracts
- `packages/config`: deployment and platform defaults
- `packages/billing`: market-aware billing provider resolution
- `packages/ai`: free-tier-only AI quota policy helpers
- `packages/sdk`: typed API client and endpoint contracts
- `packages/ui`: shared UI token helpers for the clay-inspired design system
- `.codex/skills/platform-project`: repo-owned project memory skill for Codex sessions

## Execution Plan

- Canonical delivery plan: [plan.md](./plan.md)
- Architecture snapshot: [docs/architecture.md](./docs/architecture.md)
- Repo-level Codex memory: [.codex/skills/platform-project/SKILL.md](./.codex/skills/platform-project/SKILL.md)

## Local Development

First-time setup:

- `corepack pnpm install`
- `Copy-Item .env.example .env`

Commerce provider variables for real checkout:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Without those values, the catalog UI can still render locally, but real checkout session creation and webhook reconciliation will not complete.

Start everything:

- `corepack pnpm dev`

Start one surface at a time:

- `corepack pnpm dev:web`
- `corepack pnpm dev:admin`
- `corepack pnpm dev:api`
- `corepack pnpm dev:mobile`

These commands load the root `.env` automatically so the local API URL and shared runtime settings resolve consistently across admin, web, mobile, and API development.

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

- web: `/`, `/login`, `/account`, `/store`, `/checkout/launch`, `/checkout/success`, `/checkout/cancel`
- admin: `/`, `/login`, `/request-access`, `/dashboard`, `/users`, `/content`, `/commerce`
- api: `GET /api/v1/health`, auth endpoints, workout and wellness endpoints, store endpoints, admin commerce endpoints, and billing webhook endpoints
- mobile: sign-in, sign-up, home, workouts, workout detail, live workout session, progress, reset, store tab, and checkout return route

## Platform Defaults

- Repo slug: `wellness-platform-core`
- Default branch: `main`
- Billing: Razorpay for India, Stripe for global markets
- AI: free-tier-only, best effort, graceful disable on quota exhaustion
- Branding: multi-brand per deployment
- Auth: custom JWT + Prisma + Postgres

## Phase Status

- Phase 0: complete
- Phase 1: accepted and runtime-validated
- Phase 2: implemented and locally validated
- Phase 3: implemented in code and repo-validated; live provider acceptance pending credentials and webhook testing

## Git Workflow

- Use `main` as the default branch
- Use `codex/*` for feature branches
- Keep brand-facing strings inside `packages/brand`

More detail lives in [plan.md](./plan.md) and [docs/architecture.md](./docs/architecture.md).
