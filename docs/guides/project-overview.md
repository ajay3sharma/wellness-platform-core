# Project Overview: wellness-platform-core

## Who This Guide Is For

This guide is written for someone who is **not** a full-stack developer yet and wants a practical mental model of the project before testing it.

The goal is to help you answer four questions:

1. What does this repository do?
2. Which parts are already considered stable?
3. Which parts still need extra validation?
4. How should I think like a software engineer while testing it?

This overview is based on the current project documents in `plan.md`, `README.md`, `docs/architecture.md`, and `docs/checklists/phase-5-release.md`.

## Executive Summary

`wellness-platform-core` is a **brand-neutral monorepo** for a white-label fitness and wellness platform.

In plain language, that means:

- one codebase supports multiple branded deployments
- the current first brand is `MoveYOU`
- the platform includes a consumer website, an admin portal, a mobile app, and an API
- shared packages hold common logic so teams do not duplicate code in every app

The current documented baseline is **validated through Phase 5**.

That means the repo already has:

- a working monorepo structure
- auth, workout, wellness, commerce, and AI features implemented
- release-hardening work such as readiness checks, trace IDs, logs, deterministic seed data, and smoke tests

The main remaining follow-ups are:

- **live billing validation** with real Stripe and Razorpay credentials
- **live Gemini validation** with a real `GEMINI_API_KEY`

So the project is not “unfinished” in a general sense. It is better to think of it as:

- **repo-validated and screenshot-validated locally with Postgres-backed smoke fixtures**
- with a small set of **real-provider integration checks still pending**

## Current Project Status By Phase

The project plan documents the following status:

- **Phase 0**: complete
- **Phase 1**: accepted and runtime-validated
- **Phase 2**: implemented and locally validated
- **Phase 3**: implemented in code and repo-validated
- **Phase 4**: implemented and repo-validated
- **Phase 5**: implemented and repo-validated

What that means in practice:

- “runtime-validated” means the team already confirmed the feature works in a running app flow
- “locally validated” means the feature was checked in local development
- “repo-validated” means the repo-level checks such as `lint`, `typecheck`, and `build` are green, with smoke and screenshot coverage validated after Postgres-backed seed setup

The biggest important nuance is this:

- the repo is already strong enough for local verification
- but third-party live systems still need their own acceptance testing

This is a normal software engineering pattern. Local validation proves our code and local setup are coherent. Live provider validation proves real-world integrations behave correctly.

## What Each App Does

### `apps/api`

This is the backend service built with **NestJS** and **Prisma**.

It is responsible for:

- authentication
- user sessions
- workouts
- wellness content
- commerce and subscriptions
- AI recommendation endpoints
- readiness and health endpoints
- billing webhooks

If you think of the platform as a body, the API is the central nervous system. Most other surfaces depend on it.

### `apps/web`

This is the consumer-facing website built with **Next.js**.

It currently covers:

- login
- account page
- store
- checkout bridge routes
- checkout success and cancel flows

This is the surface a customer would use in a browser.

### `apps/admin`

This is the admin and coach portal, also built with **Next.js**.

It currently covers:

- admin login
- request-access flow
- dashboard
- user and approval management
- content management
- commerce workspace
- coach workspace
- admin AI draft tools

This is the internal operations surface.

### `apps/mobile`

This is the mobile consumer app built with **Expo React Native**.

It currently covers:

- sign-up and sign-in
- workouts
- workout session flow
- progress/history
- reset/wellness content
- store tab
- checkout return route
- AI recommendation panels

This is important because mobile testing in the current repo is still **manual**, not fully automated by smoke tests.

## What The Shared Packages Do

The `packages/*` folders exist to keep logic shared and consistent:

- `packages/brand`: product naming, brand identity, theme metadata
- `packages/types`: shared contracts and type definitions
- `packages/config`: deployment defaults and runtime config rules
- `packages/billing`: billing-provider selection and interfaces
- `packages/ai`: AI policy and quota helpers
- `packages/sdk`: typed API client and shared endpoint contracts
- `packages/ui`: shared claymorphism UI helpers, route theme support, light/dark theme mode support, and tokens

This is a software engineering best practice because it reduces:

- duplicated logic
- inconsistent API usage
- brand strings scattered across the codebase
- app-specific drift

## Architecture In One Mental Model

The simplest way to picture the system is:

`web/admin/mobile -> shared sdk/config/types -> api -> prisma -> postgres`

Then two optional integration branches sit off to the side:

- `api -> billing providers (Stripe or Razorpay)`
- `api -> AI provider (Gemini)`

This separation matters for testing:

- if the UI looks wrong, the bug may still be in the API response
- if login fails, the root cause may be database, session, or env config
- if commerce fails locally, it may be because live provider keys are intentionally missing
- if AI returns unavailable, that may be an expected graceful fallback instead of a defect

Good testers do not jump straight to the UI. They test layer by layer.

## Delivered Business Scope

The current repository already covers these product areas:

- **Auth and roles**: user, coach, admin access flows
- **Fitness**: workouts, workout sessions, history
- **Wellness**: relaxation, music, daily quote, panchang
- **Commerce**: products, plans, orders, subscriptions, entitlements
- **AI**: admin draft generation and user recommendation flows
- **Hardening**: trace IDs, readiness checks, structured logs, smoke tests, screenshots
- **UI baseline**: Base44-inspired claymorphism light/dark system across web, admin, and mobile

That is a fairly broad scope. A helpful way to test it is not “test everything randomly,” but “test the platform in slices.”

Example slices:

- auth slice
- workout slice
- wellness slice
- commerce slice
- AI slice
- release-readiness slice

This matches the plan document’s phase structure and is also a strong engineering habit.

## What Is Considered Healthy Right Now

According to the docs, the bootstrap is considered healthy when:

- dependencies install successfully
- all workspaces are detected
- the dev workflow boots the apps
- `lint`, `typecheck`, and `build` pass
- `smoke:setup` and `smoke` pass after Postgres is reachable
- `screenshots` can capture evidence after smoke fixtures are seeded
- the API health endpoint returns `ok`
- the readiness endpoint reports dependency state clearly

In other words, health is not just “the page opens.”

A healthy platform shows:

- correct code quality signals
- correct startup behavior
- correct dependency status
- correct seeded test data
- correct automated smoke coverage

## What Still Needs Extra Acceptance

Two follow-ups remain explicitly tracked in the plan:

### 1. Live Billing Validation

Still needed:

- Stripe hosted checkout with real credentials
- Razorpay checkout with real credentials
- live webhook delivery and reconciliation

Why this matters:

- local UI rendering does not prove money movement works
- webhook-driven state changes are the real source of truth
- billing systems must be validated in conditions closer to production

### 2. Live Gemini Validation

Still needed:

- real `GEMINI_API_KEY`
- confirmation that admin draft generation works live
- confirmation that user recommendations work live

Why this matters:

- graceful fallback behavior may already be working locally
- but real provider acceptance still has to prove the AI integration is usable end to end

## Important Terms In Plain English

### Monorepo

One repository holding multiple apps and shared packages.

### Smoke Test

A lightweight test that answers: “Does the most important stuff still basically work?”

Smoke tests do not prove everything is perfect. They prove the system is not obviously broken.

### Seed Data

Known test records inserted into the database so tests can run against predictable data.

This is a best practice because it removes randomness from validation.

### Readiness Check

An endpoint that reports whether important dependencies are available and whether optional integrations are degraded or missing.

This helps separate:

- app logic bugs
- environment setup problems
- third-party configuration gaps

### Trace ID

A request identifier used to follow a single request through logs and error responses.

This is a release-hardening best practice because it makes debugging much faster.

## How To Think Like A Software Engineer While Testing

If you are not yet a full-stack developer, this section matters a lot.

Strong testing is not about memorizing every framework. It is about following a reliable method:

1. Start from the documented baseline, not guesses.
2. Validate one layer at a time.
3. Prefer deterministic test data over ad hoc manual clicking.
4. Record exactly what command you ran and what result you saw.
5. When something fails, ask whether it is a code defect, setup issue, or expected limitation.

Some practical best practices for this repo:

- Run `lint`, `typecheck`, and `build` before deep manual testing.
- Use `smoke:setup` before smoke tests so your database state is predictable.
- Treat health and readiness endpoints as first-line diagnostics.
- Keep a note of the environment used for testing, especially `.env` values and ports.
- Do not assume a `503` from AI is always a failure. In this repo it can be a valid graceful-unavailable state when live Gemini config is absent.
- Do not assume checkout is broken if real provider keys are missing. The docs explicitly say live billing validation is still pending.

## Recommended Testing Mindset For This Repo

The safest test order is:

1. environment and dependencies
2. static validation
3. database and seed setup
4. API health and readiness
5. automated smoke tests
6. screenshots for evidence after seeded fixtures exist
7. manual web and admin review
8. manual mobile review
9. optional live provider validation

That order is not arbitrary. It minimizes wasted time.

Example:

- if Postgres is down, debugging the login page is usually wasted effort
- if `build` fails, UI clicking is not enough confidence
- if smoke tests pass, you can focus manual effort on higher-value exploratory checks

## Final Takeaway

`wellness-platform-core` is already a substantial, structured platform with clear architecture and a documented Phase 5 baseline. The repo is not asking you to invent a testing strategy from scratch. It already tells you what “healthy” means.

Your job as a tester is to validate the system in the right order, keep evidence, and distinguish between:

- fully validated local behavior
- graceful fallback behavior
- intentionally pending live-provider acceptance

That is exactly the kind of thinking strong software engineers use.
