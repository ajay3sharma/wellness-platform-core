# Phase 5 Release Checklists

Use this document as the release-hardening checklist for the current Phase 5 baseline.

## Local Pre-Release Validation

- Run `corepack pnpm install`
- Copy `.env.example` to `.env` if the repo is not configured yet
- Confirm Postgres is available through `DATABASE_URL`
- Run `corepack pnpm lint`
- Run `corepack pnpm typecheck`
- Run `corepack pnpm build`
- Run `corepack pnpm smoke:setup`
- Run `corepack pnpm smoke`
- Confirm `GET /api/v1/health` returns `ok`
- Confirm `GET /api/v1/health/readiness` reports database status and any degraded optional dependencies clearly

## Browser And Admin Smoke Walkthrough

- Web `/store` renders the live product and plan catalog
- Web `/login` renders and seeded user sign-in reaches `/account`
- Web `/account` shows signed-out guardrails when no session is present
- Web checkout bridge renders safely when parameters are missing or when provider handoff has not started
- Admin `/login` renders and bootstrap admin sign-in reaches `/dashboard`
- Admin `/request-access` renders without browser fetch or hydration errors
- Admin `/content` renders for admins
- Admin `/commerce` renders for admins
- Coach sign-in reaches `/dashboard` but does not expose admin-only content or commerce navigation

## Mobile Manual Smoke Walkthrough

- Sign up and sign in work on the mobile app
- Workout list and workout detail load
- Start, update, complete, and review a workout session in history
- Reset tab loads relaxation and music content from the API
- Music playback opens and handles bad URLs gracefully
- Store tab loads products and plans
- Checkout return routing comes back into the app without breaking the session
- AI recommendation panels render live quota states
- AI unavailable and AI disabled states keep the surrounding tabs usable

## Pending Phase 3 Live Billing Validation

- Validate Stripe hosted checkout with live credentials
- Validate Razorpay checkout with live credentials
- Validate Stripe webhook delivery against the local or deployed endpoint
- Validate Razorpay webhook delivery against the local or deployed endpoint
- Confirm orders and subscriptions reconcile only from webhook processing

## Optional Live Gemini Acceptance

- Add a real `GEMINI_API_KEY`
- Confirm admin workout draft generation returns a usable draft payload
- Confirm admin relaxation draft generation returns a usable draft payload
- Confirm mobile workout recommendations point only to published workouts
- Confirm mobile reset recommendations point only to published relaxation and music content
- Remove or rotate the live key after testing if it should not remain in the local env
