# Architecture Snapshot

This document captures the structural platform picture. The delivery order, dependency gates, and phase-by-phase execution plan live in [plan.md](../plan.md).

## Goal

This repository is the bootstrap foundation for a custom full-stack, white-label fitness and wellness platform. It deliberately separates platform identity from product branding so the codebase can support different branded deployments over time.

## Apps

- `apps/mobile`: Expo + Expo Router mobile app for the primary consumer experience, currently implementing auth and fitness flows
- `apps/web`: Next.js consumer web scaffold for marketing, auth, commerce, and account flows
- `apps/admin`: Next.js admin and coach portal with Phase 1 content and coaching workspace
- `apps/api`: NestJS backend with auth, health, config, Prisma wiring, workouts, workout sessions, and coaching endpoints

## Shared Packages

- `@platform/types`: shared domain and platform contracts
- `@platform/brand`: brand registry, brand resolution, first brand pack
- `@platform/config`: deployment defaults and platform-level settings
- `@platform/billing`: market-based provider selection and billing interfaces
- `@platform/ai`: free-tier-only AI defaults and quota helpers
- `@platform/sdk`: typed API client for auth and health scaffolding
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
- The frontend should call internal billing services, not provider SDKs directly, unless the checkout implementation requires a provider-owned client handoff

## Auth And Data

- Authentication runs on custom JWT access and refresh tokens
- Runtime data layer runs on Postgres + Prisma
- Neon-compatible Postgres is the default dev target through environment variables
- Shared auth/session contracts live in `@platform/types`
- The current API exposes register, login, refresh, logout, current-user, health, workout, workout-session, admin-user, and coach-user endpoints

## Current Delivered Scope

- Phase 0 foundation is complete
- Phase 1 is implemented with:
  - public user signup on mobile
  - pending approval flow for coach and admin access requests
  - admin workout CRUD and publish or unpublish controls
  - mobile workout browse, detail, start, update, complete, and history flows
  - coach workspace for assigned users, workout assignment, history review, and coach notes
- Phase 2 wellness remains the next domain milestone

## AI Constraints

- AI is free-tier-only by policy
- User AI is recommendation-focused, not a full chat coach
- Admin AI is limited to draft generation and content assistance
- When quota is exhausted or providers are unavailable, AI features disable gracefully and the rest of the platform remains usable

## Local Development Workflow

Root workflow:

1. `corepack pnpm install`
2. `Copy-Item .env.example .env`
3. `corepack pnpm dev`

Root shortcuts:

- `corepack pnpm dev:web`
- `corepack pnpm dev:admin`
- `corepack pnpm dev:api`
- `corepack pnpm dev:mobile`

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

Admin routes:

- `/`
- `/login`
- `/dashboard`
- `/users`
- `/content`

API routes:

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Mobile surface:

- sign-in and sign-up routes
- tab shell
- home, workouts, workout detail, workout session, progress, reset, and store routes
- Expo app config driven by shared brand and config packages

## Bootstrap Validation

The bootstrap is considered healthy when:

1. `corepack pnpm install` succeeds
2. workspace detection sees all apps and packages
3. `corepack pnpm dev` can boot web, admin, API, and mobile together
4. `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm build` all pass
5. the API health endpoint returns `ok` at `/api/v1/health`
6. apps resolve brand metadata from shared packages rather than hardcoded strings
