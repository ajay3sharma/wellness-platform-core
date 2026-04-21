# Platform Execution Plan

This file is the canonical execution plan for `wellness-platform-core`. It defines the delivery order, dependency gates, parallel ownership split, and milestone acceptance criteria for the custom multi-brand fitness and wellness platform.

## Current Baseline

- Monorepo scaffold exists for `apps/web`, `apps/admin`, `apps/mobile`, and `apps/api`
- Shared packages exist for `brand`, `types`, `config`, `billing`, `ai`, `sdk`, and `ui`
- Brand-neutral foundation is in place with `MoveYOU` as the first brand pack
- Root dev, build, lint, and typecheck workflows are already wired
- Phase 0 is complete and committed
- Phase 1 is accepted and runtime-validated across `apps/api`, `apps/admin`, and `apps/mobile`
- Phase 2 wellness is implemented and locally validated across `apps/api`, `apps/admin`, and `apps/mobile`
- Phase 3 commerce and subscriptions are implemented in code across `apps/api`, `apps/admin`, `apps/web`, and `apps/mobile`
- Phase 4 AI recommendations, admin drafts, and quota enforcement are implemented in code across `apps/api`, `apps/admin`, and `apps/mobile`
- Root `lint`, `typecheck`, `build`, `smoke:setup`, and `smoke` are green on the current Phase 5 repo baseline
- Phase 3 live Stripe and Razorpay acceptance is intentionally parked as a pending follow-up
- Live Gemini provider acceptance still requires a real `GEMINI_API_KEY`

## Stable Platform Decisions

- Branding is multi-brand per deployment through `packages/brand`
- Product-facing naming must remain outside feature modules
- Stack stays fixed unless explicitly changed:
  - `apps/web`: Next.js
  - `apps/admin`: Next.js
  - `apps/mobile`: Expo React Native
  - `apps/api`: NestJS
  - data: Postgres + Prisma
  - auth: custom JWT + refresh tokens
- Billing defaults:
  - India: Razorpay
  - Global: Stripe
- AI defaults:
  - free-tier-only
  - best effort
  - graceful disable on quota exhaustion
  - admin AI for draft generation only in v1
  - user AI for recommendation flows only in v1
  - current provider implementation: Gemini direct behind the internal AI adapter

## Delivery Order

Follow this sequence unless the user explicitly reprioritizes:

1. Contract freeze
2. Auth + fitness first working slice
3. Wellness slice
4. Commerce + subscriptions
5. AI + quota layer
6. Hardening and release prep

## Dependency Gates

### Gate 0: Contract Freeze

Lock these shared contracts before major feature work:

- roles and auth/session types
- API error envelope
- runtime env and service defaults
- `BrandPack` and active brand resolution
- billing provider adapter interface
- AI provider and quota interfaces
- Prisma domain boundaries
- shared SDK conventions

### Gate 1: Core Auth And Data

Before real admin/mobile feature integration:

- persisted auth must exist
- protected routes must exist
- base Prisma schema must exist for the slice being implemented
- frontends must consume shared SDK/contracts rather than local mock types

### Gate 2: Per-Domain API Stability

Before a frontend domain is fully integrated, its backend contract must be stable:

- workouts API before mobile workout flows
- wellness API before reset/music/relaxation flows
- commerce API before store and checkout flows
- billing orchestration before real payment UI
- AI quota and availability API before AI buttons and banners

## Phase Breakdown

## Phase 0: Shared Foundation

### Goal

Freeze the shared contracts and repo conventions that all later work depends on.

### Main Work

- finalize shared types for auth, roles, API errors, app metadata, and platform defaults
- finalize `packages/brand`, `packages/config`, and `packages/sdk` as shared sources of truth
- lock the repo rules around branding, billing, AI, and ownership

### Parallel Work

- shared foundation owner: `packages/types`, `packages/config`, `packages/brand`, `packages/sdk`, root docs
- UI owner: `packages/ui`
- API owner: auth and schema contracts only

### Acceptance

- shared packages compile cleanly
- docs and repo skill reflect the same rules
- all app surfaces can import shared contracts without local duplication

## Phase 1: Auth + Fitness First Working Slice

### Goal

Deliver the first real end-to-end path across `apps/api`, `apps/admin`, and `apps/mobile`.

### Main Work

- persisted auth with Prisma + Postgres
- JWT access + refresh flow
- public signup with role-safe approval flow
- admin login and workout CRUD
- publish/unpublish workouts from admin
- mobile login and workout list/detail/start/complete/history
- protected API routes for auth, workouts, and workout sessions
- coach workspace for assigned users, workout assignment, history review, and coach notes

### Parallel Work

- API owner: auth, workouts, workout sessions
- admin owner: login, workout CRUD, publishing
- mobile owner: login, workout browsing, workout session flow
- UI owner: shared form, cards, and status primitives needed for admin/mobile

### Out Of Scope

- commerce and subscriptions
- AI generation and recommendations
- advanced progress analytics
- relaxation and music
- full web parity

### Acceptance

- admin can create and publish workouts
- users can log in on mobile and complete workouts
- completed workout history is visible to the user
- protected routes reject invalid or unauthorized access
- admins can approve privileged role requests and assign coaches
- coaches can view assigned users, assign published workouts, and save notes

### Acceptance Status

Phase 1 acceptance has been re-validated on the current baseline, including:

- root `dev`, `dev:api`, and `dev:admin` startup support
- bootstrap admin login
- coach and admin pending approval enforcement
- workout CRUD and publish flow
- coach assignment, notes, and workout history access
- mobile signup, login, workout session, and history flow
- refresh and logout token behavior

## Phase 2: Wellness Slice

### Goal

Add the first working reset and wellness domain on top of the auth foundation.

### Main Work

- relaxation techniques and structured steps
- music tracks and media access
- daily quote and panchang content
- admin wellness content management
- mobile reset, relaxation, and music playback flows

### Parallel Work

- API owner: wellness modules and media delivery
- admin owner: relaxation, music, quote, and panchang management
- mobile owner: reset and playback flows
- UI owner: content presentation and playback support

### Acceptance

- admin can manage wellness content
- mobile can browse and play supported wellness content
- non-wellness product flows remain unaffected

### Acceptance Status

Phase 2 has been locally validated on the current baseline, including:

- Prisma schema sync for the wellness domain
- admin wellness create, edit, publish, and unpublish endpoints
- user-facing wellness visibility rules for published versus draft content
- timezone-aware daily quote and panchang resolution
- admin route serving for `/login`, `/request-access`, and `/content`
- lint, typecheck, and build on the updated monorepo

## Phase 3: Commerce + Subscriptions

### Goal

Make the platform commercially usable across store and subscription flows.

### Main Work

- products, cart, orders, and order history
- subscription plans and entitlements
- admin product, plan, and order management
- web account, store, order history, and subscription flows
- mobile store and subscription surfaces

### Parallel Work

- API owner: products, carts, orders, plans, entitlements
- billing owner: provider adapters, transaction orchestration, webhooks
- admin owner: products, orders, plans
- web owner: store, account, order history, subscriptions
- mobile owner: store and subscription screens

### Acceptance

- user can browse, buy, and view order history
- subscriptions activate and entitlements resolve correctly
- India checkout uses Razorpay by default
- global checkout uses Stripe by default

### Acceptance Status

Phase 3 is implemented and repo-validated on the current baseline, including:

- shared commerce contracts, market-aware pricing, SDK methods, and billing helpers
- Prisma models for products, plans, carts, orders, subscriptions, entitlements, checkout sessions, and webhook receipts
- API store routes, admin commerce routes, checkout orchestration, and webhook reconciliation
- admin commerce workspace at `/commerce`
- web store, account, and internal checkout bridge routes
- mobile store flow with browser launch and deep-link return
- root `lint`, `typecheck`, and `build`

Phase 3 still needs live provider acceptance with real Stripe and Razorpay credentials before it should be treated as fully runtime-accepted.

## Phase 4: AI + Quota Layer

### Goal

Add non-critical AI in a way that never blocks the rest of the product.

### Main Work

- AI provider abstraction
- quota ledger and daily quota enforcement
- admin AI draft generation tools
- user recommendation endpoints and UI entry points
- feature flags and availability status handling

### Parallel Work

- AI owner: provider adapter, usage ledger, quotas, availability
- admin owner: draft-generation entry points
- mobile owner: recommendation flows
- web owner: no Phase 4 AI scope; keep web AI out until later reprioritization

### Acceptance

- admin AI and user AI both respect quota limits
- quota exhaustion and provider failure disable AI gracefully
- the rest of the product stays usable without AI

### Acceptance Status

Phase 4 is implemented and repo-validated on the current baseline, including:

- shared AI contracts, env config, feature flags, and SDK methods
- Prisma-backed AI usage ledger with UTC-day quota enforcement
- Gemini direct provider adapter with normalized error handling
- user AI quota route plus workout and reset recommendation endpoints
- admin AI quota route plus workout and relaxation draft endpoints
- admin dashboard quota visibility and content-studio AI draft panels
- mobile workout and reset recommendation panels that continue to work gracefully when AI is disabled, unavailable, or out of quota
- root `lint`, `typecheck`, and `build`

## Phase 5: Hardening And Release Prep

### Goal

Harden the current platform for dependable release without adding new product domains.

### Main Work

- request tracing with reliable `x-request-id` echo and `ApiError.traceId`
- readiness reporting for database, billing config, and AI config
- structured API logs for auth, access denials, checkout, webhook processing, AI quota blocks, AI provider failures, and unhandled exceptions
- deterministic seed support for local and CI smoke coverage
- Playwright smoke automation for API, web, and admin surfaces
- release and manual smoke checklists
- keep mobile validation manual in this phase

### Acceptance

- lint, typecheck, build, and smoke tests pass
- readiness reports dependency state accurately while optional billing and AI config remain bootable
- primary browser and API flows pass through deterministic smoke coverage
- manual mobile release checks are documented for the current repo baseline

### Acceptance Status

Phase 5 is now repo-validated on the current baseline, including:

- reliable `x-request-id` generation and `ApiError.traceId` propagation
- structured API logs for startup diagnostics, auth denials, role denials, checkout creation, webhook processing, and AI quota or provider failures
- `GET /api/v1/health/readiness` with dependency snapshots for database, billing config, and AI config
- deterministic smoke seed data for admin, coach, user, workouts, wellness content, products, plans, and coach workspace fixtures
- Playwright smoke coverage for API, web, and admin
- GitHub Actions smoke job definition with Postgres-backed setup
- Phase 5 release checklist docs plus manual mobile validation guidance

## Pending Follow-Ups

- Phase 3 live billing validation:
  - Stripe hosted checkout with real credentials
  - Razorpay checkout with real credentials
  - real webhook delivery and reconciliation acceptance
- live Gemini acceptance:
  - confirm the current AI surfaces against a real `GEMINI_API_KEY`

## Ownership Map

- `apps/api`: backend domain owner
- `apps/admin`: admin owner
- `apps/mobile`: mobile owner
- `apps/web`: web owner
- `packages/brand`, `packages/config`, `packages/types`, `packages/sdk`, root docs: shared foundation owner
- `packages/ui`: shared UI owner
- `packages/billing`: billing owner
- `packages/ai`: AI owner

Avoid parallel edits in the same app or domain module unless the write scopes are explicitly separated.

## Test Expectations By Milestone

- Every phase must keep `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm build` passing
- Every implemented surface must be runnable through the root dev workflow
- New API contracts should be consumed through shared SDK methods, not hand-rolled fetch calls in each app
- Brand-facing strings should continue to resolve through shared brand config

## Current Next Step

The canonical implementation phases are now repo-validated through **Phase 5**. The remaining tracked follow-ups are **Phase 3 live billing validation** and **live Gemini acceptance**, both to be resumed explicitly when needed.
