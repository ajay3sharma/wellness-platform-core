# wellness-platform-core

Brand-neutral monorepo for a white-label fitness and wellness platform.

The technical workspace stays neutral, while the first brand pack is `MoveYOU` with the tagline `Stretch. Strengthen. Renew.`. Product naming, theme tokens, billing defaults, AI quota defaults, domains, and app metadata all resolve through shared configuration instead of feature-level hardcoding.

## Current Status

- Phase 0 shared foundation is complete
- Phase 1 auth, signup, fitness, and coach workspace is now runtime-validated across `apps/api`, `apps/admin`, and `apps/mobile`
- Phase 2 wellness is implemented and locally validated across `apps/api`, `apps/admin`, and `apps/mobile`
- Phase 3 commerce and subscriptions are implemented in code across `apps/api`, `apps/admin`, `apps/web`, and `apps/mobile`, and live provider validation is parked as a pending follow-up
- Phase 4 AI recommendations, admin drafts, and quota enforcement are implemented and repo-validated across `apps/api`, `apps/admin`, and `apps/mobile`
- Phase 5 hardening, release readiness, readiness checks, trace IDs, structured logs, and smoke automation are now repo-validated across `apps/api`, `apps/web`, and `apps/admin`, with mobile still validated through the manual checklist
- Base44-inspired claymorphism UI reset is implemented across `apps/web`, `apps/admin`, and `apps/mobile`
- repo-level validation for the clay UI reset has passed: `typecheck`, `lint`, `build`, `smoke:setup`, `smoke`, and `screenshots`
- `packages/*` hold shared brand, config, types, billing, AI, SDK, and UI helpers
- `.codex/skills/platform-project` is the repo-owned project memory skill for future Codex sessions

## Pending Follow-Ups

- Phase 3 live Stripe and Razorpay acceptance with real credentials and webhook delivery
- live Gemini provider acceptance with a real `GEMINI_API_KEY`

## Workspace Layout

- `apps/mobile`: mobile consumer app with signup, login, workouts, session flow, and history
- `apps/web`: consumer website with live auth, store, account, and internal checkout bridge routes
- `apps/admin`: admin and coach portal with content, users, approvals, coaching workspace, commerce workspace, and AI draft tools
- `apps/api`: NestJS backend with Prisma-backed auth, fitness, wellness, commerce, subscriptions, AI quota and recommendation endpoints, and billing webhook endpoints
- `packages/brand`: brand registry and the first `MoveYOU` brand pack
- `packages/types`: shared platform contracts
- `packages/config`: deployment and platform defaults
- `packages/billing`: market-aware billing provider resolution
- `packages/ai`: free-tier-only AI quota policy helpers
- `packages/sdk`: typed API client and endpoint contracts
- `packages/ui`: shared claymorphism theme tokens, route color helpers, light/dark mode helpers, surface profiles, and cross-surface UI helpers
- `.codex/skills/platform-project`: repo-owned project memory skill for Codex sessions

## Execution Plan

- Canonical delivery plan: [plan.md](./plan.md)
- Architecture snapshot: [docs/architecture.md](./docs/architecture.md)
- Release checklist: [docs/checklists/phase-5-release.md](./docs/checklists/phase-5-release.md)
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

AI variables for live Gemini calls:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AI_ENABLED`
- `AI_ADMIN_DRAFTS_ENABLED`
- `AI_USER_WORKOUT_RECOMMENDATIONS_ENABLED`
- `AI_USER_RESET_RECOMMENDATIONS_ENABLED`

Without a valid Gemini key, the rest of the platform still runs and AI actions return graceful unavailable or disabled states.

Start everything:

- `corepack pnpm dev`

Start one surface at a time:

- `corepack pnpm dev:web`
- `corepack pnpm dev:admin`
- `corepack pnpm dev:api`
- `corepack pnpm dev:mobile`
- `corepack pnpm dev:mobile:web`

These commands load the root `.env` automatically so the local API URL and shared runtime settings resolve consistently across admin, web, mobile, and API development.

Default local URLs:

- web: `http://localhost:3000`
- admin: `http://localhost:3001`
- api: `http://localhost:4000/api/v1/health`
- api readiness: `http://localhost:4000/api/v1/health/readiness`
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
- `corepack pnpm smoke:setup` after Postgres is reachable through `DATABASE_URL`
- `corepack pnpm smoke` after `smoke:setup` succeeds
- `corepack pnpm screenshots` after `smoke:setup` succeeds
- `corepack pnpm format`

Screenshot artifacts are written to `test-results/screenshots/` with an `index.json` manifest after each successful screenshot run.

Smoke fixture accounts after `corepack pnpm smoke:setup`:

- admin: `support@moveyou.app` / `dev-password`
- coach: `coach.smoke@moveyou.app` / `dev-password`
- user: `user.smoke@moveyou.app` / `dev-password`

## Current Scaffolded Routes

- web: `/`, `/login`, `/account`, `/store`, `/checkout/launch`, `/checkout/success`, `/checkout/cancel`
- admin: `/`, `/login`, `/request-access`, `/dashboard`, `/users`, `/content`, `/commerce`
- api: `GET /api/v1/health`, auth endpoints, workout and wellness endpoints, AI quota and recommendation endpoints, store endpoints, admin commerce endpoints, and billing webhook endpoints
- mobile: sign-in, sign-up, home, workouts, workout detail, live workout session, progress, reset, store tab, checkout return route, and AI recommendation panels in workouts and reset

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
- Phase 3: implemented in code and repo-validated; live provider acceptance is parked as a pending follow-up
- Phase 4: implemented and repo-validated; live Gemini acceptance pending `GEMINI_API_KEY`
- Phase 5: implemented and repo-validated for request tracing, readiness, logs, smoke coverage, CI smoke setup, and release checklists
- UI reset: Base44-inspired claymorphism visual baseline implemented and screenshot-validated under `test-results/screenshots/`

## Git Workflow

- Use `main` as the default branch
- Commit directly to `main` for accepted work and normal milestone progress
- Use `codex/*` only for risky or incomplete work that should stay isolated temporarily
- Keep brand-facing strings inside `packages/brand`

More detail lives in [plan.md](./plan.md) and [docs/architecture.md](./docs/architecture.md).

## UI System

- The active visual standard is Base44-inspired claymorphism wellness: soft pastel route surfaces, rounded clay cards, slate/navy text, orange focus actions, and gentle neumorphic shadows across `web`, `admin`, and `mobile`
- Brand theme resolves through mode-aware semantic tokens plus route themes for `home`, `workouts`, `reset`, `store`, `progress`, `admin`, and `profile`
- Typography is simple `Inter, system-ui, sans-serif` with relaxed line-height and light display headings
- `packages/ui` owns the resolved surface theme snapshot and density profile for `web`, `admin`, `mobile`, and `api`
- Web and admin consume shared CSS variable output from the brand token system instead of page-level hardcoded colors
- Mobile consumes the same token foundation through shared React Native primitives and screen-level composition helpers
- Light mode uses `#FAFAFA`, white clay cards, slate text, pastel route colors, and orange focus actions
- Dark mode uses deep slate canvas, lifted charcoal cards, pastel route accents, readable off-white text, and subdued clay shadows
- Do not reintroduce Apple-neutral styling as the active baseline; route colors and clay shadows should remain owned by shared brand/UI tokens
