# Architecture Snapshot

This document captures the structural platform picture. The delivery order, dependency gates, and phase-by-phase execution plan live in [plan.md](../plan.md).

## Goal

This repository is the bootstrap foundation for a custom full-stack, white-label fitness and wellness platform. It deliberately separates platform identity from product branding so the codebase can support different branded deployments over time.

## Apps

- `apps/mobile`: Expo + Expo Router mobile app for the primary consumer experience, currently implementing auth and fitness flows
- `apps/web`: Next.js consumer web app for marketing, auth, store, account, and internal checkout bridge flows
- `apps/admin`: Next.js admin and coach portal with content, coaching workspace, and commerce operations
- `apps/api`: NestJS backend with auth, health, readiness, config, Prisma wiring, workouts, wellness, commerce, subscriptions, AI, and billing webhooks

## Shared Packages

- `@platform/types`: shared domain and platform contracts
- `@platform/brand`: brand registry, brand resolution, first brand pack
- `@platform/config`: deployment defaults and platform-level settings
- `@platform/billing`: market-based provider selection and billing interfaces
- `@platform/ai`: free-tier-only AI defaults and quota helpers
- `@platform/sdk`: typed API client for auth, workouts, wellness, commerce, and AI flows
- `@platform/ui`: brand-aware UI token helpers for the future design system

## Branding

- Brand data is expressed through `BrandPack`
- The first brand pack is `MoveYOU`
- The app name, tagline, SEO copy, support email, assets, deep links, and theme tokens come from brand config
- Feature modules should never hardcode the active product name

## Billing

- Payment logic is abstracted behind shared billing contracts
- Default provider routing:
  - India: Razorpay
  - Global: Stripe
- Checkout launch always starts from an internal platform session and bridge URL
- Webhooks are the source of truth for marking orders as paid and subscriptions as active
- The frontend should call internal billing services, not provider SDKs directly, unless the checkout implementation requires a provider-owned client handoff

## Auth And Data

- Authentication runs on custom JWT access and refresh tokens
- Runtime data layer runs on Postgres + Prisma
- Neon-compatible Postgres is the default dev target through environment variables
- Shared auth/session contracts live in `@platform/types`
- The current API exposes register, login, refresh, logout, current-user, health, workout, workout-session, admin-user, and coach-user endpoints

## Current Delivered Scope

- Phase 0 foundation is complete
- Phase 1 is accepted and runtime-validated with:
  - public user signup on mobile
  - pending approval flow for coach and admin access requests
  - admin workout CRUD and publish or unpublish controls
  - mobile workout browse, detail, start, update, complete, and history flows
  - coach workspace for assigned users, workout assignment, history review, and coach notes
- Phase 2 is implemented and locally validated with:
  - admin-managed relaxation techniques and guided steps
  - admin-managed music tracks through external hosted audio URLs
  - admin-managed daily quote and panchang entries
  - mobile reset landing backed by the wellness API
  - relaxation detail flow and in-app music player screens
- Phase 3 commerce is implemented and repo-validated with:
  - admin commerce workspace for products, plans, orders, and subscriptions
  - append-only product and subscription pricing per market
  - web store, account, checkout bridge, and return routes
  - mobile store flows with browser handoff and deep-link return
  - API-backed cart, orders, subscriptions, entitlements, checkout sessions, and provider webhooks
- Phase 4 AI is implemented and repo-validated with:
  - Gemini-backed AI adapter behind the internal AI module
  - Prisma-backed AI usage ledger and UTC-midnight quota enforcement
  - admin dashboard quota visibility and draft-generation tools for workouts and relaxation
  - mobile workout and reset recommendation entry points that only rank published catalog content
- Phase 5 is now repo-validated with:
  - request tracing through `x-request-id` and `ApiError.traceId`
  - readiness checks for database, billing config, and AI config
  - structured API logs for auth, access denials, checkout, webhook processing, and AI failures
  - deterministic smoke fixtures plus Playwright smoke coverage for API, web, and admin
- Live provider checkout acceptance still depends on real Stripe and Razorpay credentials plus webhook delivery

## AI Constraints

- AI is free-tier-only by policy
- Gemini direct is the current provider implementation, but the API keeps the provider swappable
- User AI is recommendation-focused, not a full chat coach
- Admin AI is limited to draft generation and content assistance
- When quota is exhausted or providers are unavailable, AI features disable gracefully and the rest of the platform remains usable

## Local Development Workflow

Root workflow:

1. `corepack pnpm install`
2. `Copy-Item .env.example .env`
3. `corepack pnpm dev`
4. `corepack pnpm smoke:setup`
5. `corepack pnpm smoke`

Root shortcuts:

- `corepack pnpm dev:web`
- `corepack pnpm dev:admin`
- `corepack pnpm dev:api`
- `corepack pnpm dev:mobile`

The repo-level dev entry points load the root `.env` before starting each workspace so local API base URLs and bootstrap credentials stay aligned across surfaces.

Default local ports:

- web: `3000`
- admin: `3001`
- api: `4000`
- Expo Metro: `8081`

## Current Surfaces

Web routes:

- `/`
- `/login`
- `/account`
- `/store`
- `/checkout/launch`
- `/checkout/success`
- `/checkout/cancel`

Admin routes:

- `/`
- `/login`
- `/dashboard`
- `/users`
- `/content`
- `/commerce`

API routes:

- `GET /api/v1/health`
- `GET /api/v1/health/readiness`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/ai/quota/me`
- `POST /api/v1/ai/recommendations/workout`
- `POST /api/v1/ai/recommendations/reset`
- store routes for products, plans, cart, checkout sessions, orders, subscriptions, and entitlements
- admin commerce routes for products, plans, orders, and subscriptions
- admin AI routes for quota plus workout and relaxation drafts
- billing webhook routes for Stripe and Razorpay

Mobile surface:

- sign-in and sign-up routes
- tab shell
- home, workouts, workout detail, workout session, progress, reset, and store routes
- AI recommendation panels on workouts and reset
- checkout return route for browser-based payment handoff
- Expo app config driven by shared brand and config packages

## Bootstrap Validation

The bootstrap is considered healthy when:

1. `corepack pnpm install` succeeds
2. workspace detection sees all apps and packages
3. `corepack pnpm dev` can boot web, admin, API, and mobile together
4. `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm build` all pass
5. `corepack pnpm smoke:setup` and `corepack pnpm smoke` validate the seeded browser and API baseline
6. the API health endpoint returns `ok` at `/api/v1/health` and readiness reflects dependency state at `/api/v1/health/readiness`
7. apps resolve brand metadata from shared packages rather than hardcoded strings
