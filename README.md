# wellness-platform-core

Brand-neutral monorepo bootstrap for the white-label fitness and wellness platform.

The technical workspace stays neutral, while the first brand pack is `MoveYOU` with the tagline `Stretch. Strengthen. Renew.`. Product naming, theme tokens, billing defaults, and AI quota defaults all resolve through shared configuration instead of feature-level hardcoding.

## Workspace Layout

- `apps/mobile`: mobile consumer app shell metadata
- `apps/web`: consumer website shell metadata
- `apps/admin`: admin and coach portal shell metadata
- `apps/api`: backend service manifest and platform settings
- `packages/brand`: brand registry and the first `MoveYOU` brand pack
- `packages/types`: shared platform contracts
- `packages/config`: deployment and platform defaults
- `packages/billing`: market-aware billing provider resolution
- `packages/ai`: free-tier-only AI quota policy helpers
- `packages/ui`: shared UI token helpers for the clay-inspired design system

## Commands

- `corepack pnpm install`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`
- `corepack pnpm format`

## Platform Defaults

- Repo slug: `wellness-platform-core`
- Default branch: `main`
- Billing: Razorpay for India, Stripe for global markets
- AI: free-tier-only, best effort, graceful disable on quota exhaustion
- Branding: multi-brand per deployment

## Git Workflow

- Use `main` as the default branch
- Use `codex/*` for feature branches
- Keep brand-facing strings inside `packages/brand`

More detail lives in [docs/architecture.md](./docs/architecture.md).

