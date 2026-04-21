---
name: platform-project
description: Use when working in the wellness-platform-core repository. This is the repo-level memory file for platform rules, stable product decisions, milestone order, parallel ownership, and standard commands.
---

# Platform Project

Use this skill for implementation work in this repo. Treat it as the stable project memory file for future Codex chats, and use `plan.md` as the canonical execution roadmap.

## Core Product Rules

- Keep the technical platform brand-neutral. Never hardcode product-facing brand names outside `packages/brand`.
- Treat `packages/brand` as the source of truth for app name, tagline, metadata, domains, assets, theme tokens, store metadata, and legal copy.
- The platform is multi-brand per deployment, not runtime multi-tenant branding.
- Keep the stack fixed unless the user changes it:
  - `apps/web`: Next.js consumer web
  - `apps/admin`: Next.js admin and coach portal
  - `apps/mobile`: Expo React Native app
  - `apps/api`: NestJS backend
  - data: Postgres + Prisma
  - auth: custom JWT + refresh tokens
- Keep billing routing fixed unless the user changes it:
  - India: Razorpay
  - Global: Stripe
- Keep AI policy fixed unless the user changes it:
  - free-tier-only
  - best effort
  - graceful disable on quota exhaustion
  - no paid AI overflow
  - admin AI is draft-generation-only in v1
  - user AI is recommendation-only in v1
  - current provider implementation is Gemini direct behind the internal API adapter

## Current Product Surfaces

- `mobile`: primary end-user app for workouts, wellness, progress, store, subscriptions, and user AI recommendations
- `web`: marketing, auth, account, store, subscriptions, order history, and light content access
- `admin`: content operations, coach workflows, commerce operations, assignments, and admin AI draft tools
- `api`: shared system backbone for auth, content, commerce, subscriptions, AI, and notifications

## Repo Map

- `apps/web`: consumer web
- `apps/admin`: admin and coach portal
- `apps/mobile`: Expo mobile app
- `apps/api`: NestJS backend
- `packages/types`: shared domain and API contracts
- `packages/config`: runtime env and service defaults
- `packages/brand`: active brand packs and metadata helpers
- `packages/billing`: payment provider resolution
- `packages/ai`: quota and AI policy helpers
- `packages/sdk`: typed API client
- `packages/ui`: shared theme helpers and later UI primitives

## Ownership Guidance

- Shared package changes come first when app work depends on them.
- Keep write scopes disjoint during parallel work:
  - API owner: `apps/api`
  - web owner: `apps/web`
  - admin owner: `apps/admin`
  - mobile owner: `apps/mobile`
  - shared foundation owner: `packages/*`, root config, repo rules, and shared docs
- Do not move brand, auth, billing, or AI decisions into app-local constants if a shared package already owns them.
- For parallel work, prefer four to six active ownership zones, not maximum worker count.

## Delivery Order

Follow this sequence unless the user changes it:

1. Contract freeze
2. Auth + fitness first working slice
3. Wellness slice
4. Commerce + subscriptions
5. AI + quota layer
6. Hardening and release prep

The detailed breakdown, dependency gates, and milestone acceptance criteria live in `plan.md`.

## Current Phase Status

- Phase 0: complete
- Phase 1: accepted and runtime-validated in the current baseline
- Phase 2: implemented and locally validated in the current baseline
- Phase 3: implemented in code and repo-validated in the current baseline
- Phase 4: implemented in code and repo-validated in the current baseline
- Phase 5: implemented and repo-validated in the current baseline
- Phase 3 live billing acceptance is parked as a pending follow-up until explicitly resumed
- Phase 4 live AI acceptance still requires a real `GEMINI_API_KEY` for end-to-end provider calls
- Phase 5 baseline includes:
  - request tracing
  - readiness
  - structured logs
  - deterministic seed support
  - Playwright smoke coverage for API, web, and admin
  - manual mobile release checks

## Contract Freeze Rules

Before large feature work, lock these shared contracts:

- roles and auth/session types
- API error envelope
- brand config schema
- billing adapter interface
- AI provider and quota interfaces
- Prisma domain boundaries
- SDK conventions and API client patterns

This is the main dependency gate before major parallel implementation.

## Phase 1 Baseline

The first real product milestone is accepted and includes more than the earliest slim slice:

1. persisted auth with Prisma + Postgres
2. public signup for users plus approval-gated coach and admin requests
3. admin login + workout CRUD + publish/unpublish
4. mobile login + workout browse/detail/start/complete/history
5. protected API routes for auth, workouts, workout sessions, admin user operations, and coach workspace operations
6. coach workspace for assigned users, workout assignment, history review, and coach notes

Phase 1 acceptance has already been validated on the current baseline through the supported local runtime path, including admin auth, request-access flow, workout CRUD and publishing, coach assignment workflows, mobile user signup and workout sessions, and refresh/logout protections.

`apps/web` remains mostly scaffold-only at this stage.

### Still Out Of Scope After Phase 1

- commerce checkout
- subscriptions
- AI generation
- AI recommendations
- relaxation and music
- full web parity with mobile

## Parallel Breakdown

### Phase A: Shared Foundation

- Shared foundation owner:
  - `packages/types`
  - `packages/config`
  - `packages/brand`
  - `packages/sdk`
  - root repo rules and docs
- UI owner:
  - `packages/ui`
- API owner:
  - auth, roles, Prisma schema, shared backend contracts

### Phase B: Auth + Fitness Slice

- API owner:
  - auth
  - workouts
  - workout sessions
- admin owner:
  - login
  - workout CRUD
- mobile owner:
  - login
  - workout browse/detail/session flow
- UI owner:
  - shared component and token support needed by admin/mobile

### Phase C: Wellness Slice

- API owner: wellness modules and media access
- admin owner: relaxation, music, quotes, panchang management
- mobile owner: reset, relaxation, music playback
- UI owner: player and content presentation support

### Phase D: Commerce + Subscriptions

- API owner: products, carts, orders, plans, entitlements
- billing owner: provider adapters, checkout launch orchestration, and webhook handling
- admin owner: products, plans, orders, subscriptions
- web owner: store, account, order history, subscriptions, and checkout bridge
- mobile owner: store, subscription surfaces, and checkout return flow

### Phase E: AI + Quotas

- AI owner: provider adapter, usage ledger, quotas, availability status
- admin owner: AI draft tools
- mobile owner: recommendation entry points
- web owner: no current Phase 4 AI scope; keep web AI out unless the user reprioritizes it

### Phase F: Hardening + Release Readiness

- API owner:
  - request tracing
  - readiness
  - structured logs
  - config diagnostics
- shared foundation owner:
  - deterministic seed support
  - smoke harness
  - CI smoke job
  - release docs and checklists
- web owner:
  - keep store, login, account, and checkout bridge smoke-safe
- admin owner:
  - keep login, request-access, dashboard, content, and commerce smoke-safe
- mobile owner:
  - maintain manual validation coverage only in this phase

## Billing And AI Rules

- Keep all payment logic behind the internal billing abstraction.
- India traffic should use Razorpay by default.
- Global traffic should use Stripe by default.
- Use an internal checkout launch URL as the handoff point for both web and mobile.
- Finalize orders and subscriptions from webhook reconciliation, not success-page redirects.
- Carts are for one-time products only. Subscription checkout is a separate flow.
- AI must never be required for core product usability.
- When AI quota is exhausted or the provider is unavailable:
  - return a standard unavailable or quota error from the API
  - disable the related UI gracefully
  - do not block non-AI product flows

## Standard Commands

- Install: `corepack pnpm install`
- Dev all: `corepack pnpm dev`
- Dev web: `corepack pnpm dev:web`
- Dev admin: `corepack pnpm dev:admin`
- Dev API: `corepack pnpm dev:api`
- Dev mobile: `corepack pnpm dev:mobile`
- Lint: `corepack pnpm lint`
- Typecheck: `corepack pnpm typecheck`
- Build: `corepack pnpm build`
- Smoke setup: `corepack pnpm smoke:setup`
- Smoke: `corepack pnpm smoke`
- Brand check: `node scripts/brand-check.mjs`
- Repo check: `node scripts/repo-check.mjs`
- Branch names: `codex/<task-name>`

The root dev commands load the repo-level `.env` before starting each workspace so local service URLs and bootstrap settings stay consistent.

## Local Defaults

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:4000`
- API health: `http://localhost:4000/api/v1/health`
- Mobile Metro: `http://localhost:8081`

## Read Before Large Changes

- `plan.md`
- `README.md`
- `docs/architecture.md`

Use this file to preserve stable repo decisions. Do not duplicate transient task notes here.
