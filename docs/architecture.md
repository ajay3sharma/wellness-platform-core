# Architecture Snapshot

## Goal

This repository is the bootstrap foundation for a custom full-stack, white-label fitness and wellness platform. It deliberately separates platform identity from product branding so the codebase can support different branded deployments over time.

## Apps

- `apps/mobile`: Expo + Expo Router mobile app scaffold for the primary consumer experience
- `apps/web`: Next.js consumer web scaffold for marketing, auth, commerce, and account flows
- `apps/admin`: Next.js admin and coach portal scaffold
- `apps/api`: NestJS backend scaffold with auth, health, config, and Prisma wiring

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

- Authentication scaffolds on custom JWT access and refresh tokens
- Runtime data layer scaffolds on Postgres + Prisma
- Neon-compatible Postgres is the default dev target through environment variables
- Shared auth/session contracts live in `@platform/types`
- The current API scaffold exposes login, refresh, logout, current-user, and health endpoints

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

## Current Scaffolded Surfaces

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

Mobile scaffold:

- auth entry route
- tab shell
- home, workouts, reset, progress, and store tabs
- Expo app config driven by shared brand and config packages

## Bootstrap Validation

The bootstrap is considered healthy when:

1. `corepack pnpm install` succeeds
2. workspace detection sees all apps and packages
3. `corepack pnpm dev` can boot web, admin, API, and mobile together
4. `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm build` all pass
5. the API health endpoint returns `ok` at `/api/v1/health`
6. apps resolve brand metadata from shared packages rather than hardcoded strings
