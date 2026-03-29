# Architecture Snapshot

## Goal

This repository is the bootstrap foundation for a custom full-stack, white-label fitness and wellness platform. It deliberately separates platform identity from product branding so the codebase can support different branded deployments over time.

## Apps

- `apps/mobile`: primary consumer experience for iOS and Android
- `apps/web`: selective consumer website for marketing, auth, commerce, and account flows
- `apps/admin`: operational console for admins and coaches
- `apps/api`: NestJS-ready backend boundary with shared configuration and service manifests

## Shared Packages

- `@platform/types`: shared domain and platform contracts
- `@platform/brand`: brand registry, brand resolution, first brand pack
- `@platform/config`: deployment defaults and platform-level settings
- `@platform/billing`: market-based provider selection and billing interfaces
- `@platform/ai`: free-tier-only AI defaults and quota helpers
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

## AI Constraints

- AI is free-tier-only by policy
- User AI is recommendation-focused, not a full chat coach
- Admin AI is limited to draft generation and content assistance
- When quota is exhausted or providers are unavailable, AI features disable gracefully and the rest of the platform remains usable

## Bootstrap Validation

The bootstrap is considered healthy when:

1. `corepack pnpm install` succeeds
2. workspace detection sees all apps and packages
3. `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm build` all pass
4. apps resolve brand metadata from shared packages rather than hardcoded strings

