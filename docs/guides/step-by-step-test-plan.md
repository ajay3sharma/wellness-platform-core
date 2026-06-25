# Step-By-Step Test Plan: wellness-platform-core

## Purpose

This guide gives you a practical, beginner-friendly path to test `wellness-platform-core` without needing to think like a senior full-stack engineer first.

It is based on the project’s current documented baseline:

- phases are validated through **Phase 5**
- local smoke coverage exists for **API**, **web**, and **admin**
- **mobile validation is still manual**
- visual screenshots require Postgres-backed `smoke:setup` first
- **live billing** and **live Gemini** validation are still tracked follow-ups

The plan below is ordered from lowest risk to highest value. That is deliberate and follows software engineering best practice.

## Testing Strategy Before You Start

Use this order every time:

1. Confirm the environment.
2. Install dependencies.
3. Configure local environment variables.
4. Validate static quality gates.
5. Prepare deterministic database data.
6. Check API health and readiness.
7. Run automated smoke tests.
8. Capture screenshots as evidence after seeded fixtures exist.
9. Run manual web, admin, and mobile checks.
10. Only after all of that, attempt live-provider tests.

Why this order is good engineering:

- it catches setup problems early
- it reduces noisy debugging
- it separates code defects from environment defects
- it gives you stronger confidence with less wasted time

## What You Need Before Testing

### Required Tools

From `package.json`, the repo expects:

- **Node.js** `>=24.0.0`
- **pnpm** `>=10.0.0`
- **Postgres**

You also need:

- **Corepack** enabled so `corepack pnpm ...` works
- **Playwright browsers** installed for browser smoke tests

### Practical Checklist

Before you run anything inside the repo, make sure:

- Node is installed
- Corepack is available
- Postgres is running
- port `5432` is available for Postgres unless you changed `DATABASE_URL`
- ports `3000`, `3001`, `4000`, and `8081` are free for the apps

### Best Practice

Write down your environment once at the start of testing:

- Node version
- pnpm version
- database host and port
- whether you are using local or cloud Postgres
- whether Stripe, Razorpay, or Gemini keys are present

This makes later debugging much easier.

## Step 1: Open The Repo And Install Dependencies

From the project root:

```powershell
cd C:\Users\ajay3\OneDrive\Desktop\Codex_App\Nirva_Fit\wellness-platform-core
corepack pnpm install
```

### What This Does

- installs all workspace dependencies
- prepares every app and shared package
- gives you the tools needed for linting, building, and smoke tests

### Expected Result

The install finishes successfully without dependency-resolution errors.

### Best Practice

If install fails, stop here and fix that first. Do not continue into runtime testing with a broken dependency graph.

## Step 2: Create Your Local `.env`

The repo includes a ready-made environment template.

Run:

```powershell
Copy-Item .env.example .env
```

### Important Default Values

The template includes these local defaults:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wellness_platform`
- `API_PORT=4000`
- `WEB_PORT=3000`
- `ADMIN_PORT=3001`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `EXPO_PUBLIC_API_URL=http://localhost:4000`

Bootstrap admin credentials:

- email: `support@moveyou.app`
- password: `dev-password`

### What To Understand Here

- The repo is designed to load the root `.env` automatically for the apps.
- Empty Stripe, Razorpay, and Gemini keys are allowed for local baseline testing.
- Missing live provider keys do **not** mean the repo is broken.

### Best Practice

Do not edit many environment variables at once unless you have to. Change only what is necessary and keep a note of every change.

## Step 3: Make Sure Postgres Is Available

The smoke setup and most real flows depend on Postgres.

At minimum, confirm your `DATABASE_URL` points to a reachable database.

If you are using the default local database, a useful basic check is:

```powershell
Test-NetConnection localhost -Port 5432
```

### Expected Result

- the port check succeeds
- or you already know your custom `DATABASE_URL` is correct

### Why This Matters

If the database is not reachable:

- login will fail
- seed setup will fail
- readiness checks will report a database problem
- smoke tests will fail for the wrong reason

### Best Practice

Environment failures are not application bugs. Separate those two categories in your notes.

## Step 4: Install Playwright Browsers If This Is Your First Test Run

The repo uses Playwright for smoke tests and screenshots.

If this machine has never run Playwright before, install the browser once:

```powershell
corepack pnpm exec playwright install chromium
```

### Expected Result

Chromium installs successfully and Playwright can launch it during smoke tests.

### Best Practice

Treat this as a one-time machine setup step, not a repo defect if it is missing.

## Step 5: Run Static Quality Gates

These commands are the fastest way to validate the codebase before opening browsers.

Run them in this order:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

### What Each Command Means

`lint`

- checks code quality rules
- catches repo conventions and common mistakes

`typecheck`

- checks TypeScript contracts
- catches many integration mismatches before runtime

`build`

- confirms the apps can compile for production-like output

### Expected Result

All three commands pass.

### Best Practice

If `lint` or `typecheck` fails, fix that signal before doing broad manual testing. A failing static gate usually means you do not yet have a trustworthy baseline.

## Step 6: Seed Deterministic Smoke Data

Now prepare the database with known records used by the smoke tests.

Run:

```powershell
corepack pnpm smoke:setup
```

### What This Command Does

According to `scripts/smoke-setup.mjs`, it:

- generates Prisma client code
- pushes the Prisma schema to the database
- runs `apps/api/scripts/seed-smoke.mjs`

The seed script creates deterministic fixtures for:

- admin user
- coach user
- normal user
- published workout
- published relaxation technique
- published music track
- published store product
- published subscription plan
- coach assignment and history data

### Seeded Test Accounts

- admin: `support@moveyou.app` / `dev-password`
- coach: `coach.smoke@moveyou.app` / `dev-password`
- user: `user.smoke@moveyou.app` / `dev-password`

### Why This Matters

This is one of the strongest engineering practices in the repo. Deterministic fixtures mean:

- tests are repeatable
- failures are easier to diagnose
- manual verification can use the same data every time

### Best Practice

Always run `smoke:setup` before smoke tests if you are unsure about database state.

## Step 7: Boot The System For Manual Observation

Before or after automated smoke, it is useful to run the dev stack once so you can observe the surfaces directly.

Run:

```powershell
corepack pnpm dev
```

If you want only one surface, you can also use:

```powershell
corepack pnpm dev:web
corepack pnpm dev:admin
corepack pnpm dev:api
corepack pnpm dev:mobile
corepack pnpm dev:mobile:web
```

### Default Local URLs

- web: `http://localhost:3000`
- admin: `http://localhost:3001`
- api health: `http://localhost:4000/api/v1/health`
- api readiness: `http://localhost:4000/api/v1/health/readiness`
- Expo web/mobile dev server: `http://localhost:8081`

### Best Practice

When a frontend looks broken, check the API health endpoint before assuming the UI is the problem.

## Step 8: Verify API Health And Readiness

With the API running, check the baseline endpoints.

In a browser or PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri 'http://localhost:4000/api/v1/health'
Invoke-RestMethod -Method Get -Uri 'http://localhost:4000/api/v1/health/readiness'
```

### Expected Result

For `/health`:

- the service responds successfully
- the health result indicates the API is alive

For `/health/readiness`:

- the service responds successfully
- the dependency snapshot includes `database`, `billing`, and `ai`
- `database` should report `ok`

### Why This Matters

This is the fastest way to separate:

- API not running
- database not available
- optional provider configuration missing

### Best Practice

Readiness checks are diagnostic tools, not just “nice to have” endpoints. Use them before debugging login, store, or admin screens.

## Step 9: Run The Automated Smoke Tests

Now run the main automated baseline:

```powershell
corepack pnpm smoke
```

### What This Covers

From the Playwright smoke suite, it validates:

- API health and readiness
- request trace ID echo behavior
- auth login, refresh, and logout lifecycle
- role access rules for admin, coach, and user
- graceful AI unavailable or disabled behavior
- web store page rendering
- web login and signed-in account flow
- safe checkout bridge behavior with missing params
- admin login and request-access rendering
- admin dashboard, content, and commerce access
- coach restriction from admin-only authoring areas

### Important Expected Behaviors

These are especially worth understanding:

- A `401` on an unauthorized protected route is expected in some tests.
- A `403` for coach or user access to admin routes is expected.
- AI recommendation tests may pass with either `200` or `503`.
- A `503` can be valid if the code returns a graceful `AI_TEMPORARILY_UNAVAILABLE` or `AI_DISABLED` response.

### Best Practice

Know the difference between:

- expected protected-route failures
- real unexpected failures

Good testers understand whether a failure is intentional behavior or a defect.

## Step 10: Capture Screenshot Evidence

If the smoke suite passes, capture route evidence:

```powershell
corepack pnpm screenshots
```

### What This Does

It runs Playwright screenshot coverage and writes artifacts to a new append-only run folder:

- `test-results/screenshots/runs/<timestamp>-<commit>/`
- `test-results/screenshots/index.json`

It starts:

- API
- web
- admin
- mobile web

It requires `corepack pnpm smoke:setup` to have succeeded first, because the screenshots resolve seeded users and content dynamically.

### Why This Matters

Screenshots give you lightweight visual evidence of:

- current route rendering
- obvious regressions
- what was actually tested on a specific run

Older screenshot run folders are not deleted by the screenshot command. The root `index.json` points to the latest run while preserving previous folders.

### Best Practice

Keep screenshot artifacts for significant test runs. Evidence is part of professional QA and release confidence.

## Step 11: Manual Web Validation

Even after automation passes, do a short manual walk.

### Web Routes To Check

Open:

- `http://localhost:3000/store`
- `http://localhost:3000/login`
- `http://localhost:3000/account`
- `http://localhost:3000/checkout/launch`

### Manual Checks

On `/store`:

- the store page renders
- products and plans from the seeded fixtures are visible

On `/login`:

- the sign-in form renders
- sign in with `user.smoke@moveyou.app` / `dev-password`
- you land on `/account`

On `/account`:

- signed-in users see orders, entitlements, and subscription state
- signed-out access shows guardrails instead of crashing

On `/checkout/launch`:

- the route handles missing parameters safely
- it does not crash when a provider handoff has not started

### Best Practice

During manual testing, try one “happy path” and one “guardrail path” for each surface.

Example:

- happy path: user logs in successfully
- guardrail path: user opens account without a session

## Step 12: Manual Admin And Coach Validation

This is important because role separation is a major platform rule.

### Admin Flow

Open `http://localhost:3001/login` and sign in with:

- `support@moveyou.app`
- `dev-password`

Then check:

- `/dashboard`
- `/content`
- `/commerce`

### Expected Admin Result

- admin login succeeds
- admin reaches the dashboard
- content and commerce pages are available

### Coach Flow

Sign in with:

- `coach.smoke@moveyou.app`
- `dev-password`

Then check:

- coach reaches `/dashboard`
- admin-only navigation such as `Content` and `Commerce` is not shown
- direct access to `/content` shows the admin-only guardrail

### Why This Matters

A big part of platform correctness is not only “can admins do admin things?” but also “can non-admins stay out of admin things?”

### Best Practice

Authorization tests should always verify both:

- allowed access
- denied access

## Step 13: Manual API Spot Checks

If you want to validate the API directly without the UI, do these spot checks.

### Login Test

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri 'http://localhost:4000/api/v1/auth/login' `
  -ContentType 'application/json' `
  -Body '{"email":"support@moveyou.app","password":"dev-password"}'
```

### What To Look For

- the request succeeds
- you receive a user payload and tokens

### Readiness Test

```powershell
Invoke-RestMethod -Method Get -Uri 'http://localhost:4000/api/v1/health/readiness'
```

### What To Look For

- the response includes dependency snapshots
- `database` should be healthy
- `billing` and `ai` may show degraded or unavailable states if real keys are missing

### Best Practice

When UI issues are unclear, direct API checks help you find whether the problem is frontend rendering or backend behavior.

## Step 14: Manual Mobile Validation

The project docs explicitly say mobile remains manually validated in the current Phase 5 baseline.

Run one of:

```powershell
corepack pnpm dev:mobile
```

or, for browser-based mobile rendering:

```powershell
corepack pnpm dev:mobile:web
```

### Core Mobile Checks

Use the seeded normal user where sign-in is required:

- `user.smoke@moveyou.app`
- `dev-password`

Check these flows:

1. Sign up and sign in work.
2. Workout list loads.
3. Workout detail loads.
4. Start a workout session.
5. Update or progress the session.
6. Complete the session.
7. Review history or progress.
8. Open the Reset tab.
9. Verify relaxation content loads.
10. Verify music content loads.
11. Open a music item and confirm playback behaves sensibly.
12. Open the Store tab and confirm products and plans load.
13. Confirm checkout return routing does not break the app session.
14. Open AI recommendation panels in workouts and reset.
15. Confirm AI disabled or unavailable states do not break the surrounding screen.

### What To Expect

- wellness content should use the seeded published fixtures
- store content should use the seeded product and plan
- AI may be available, unavailable, or disabled depending on your env
- AI unavailability should be graceful, not app-breaking

### Best Practice

Mobile manual testing should focus on user journey continuity:

- can the user keep using the app after an error?
- can they recover from unavailable AI or bad media URLs?
- does navigation remain stable after checkout return?

## Step 15: Optional Live Billing Validation

Only do this after the local baseline is healthy.

You need real values for:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

### What To Validate

- Stripe hosted checkout
- Razorpay checkout
- webhook delivery
- order reconciliation
- subscription activation

### Critical Engineering Note

The docs state that orders and subscriptions should reconcile from **webhook processing**, not from frontend optimism.

That is a very important best practice. Payment truth should come from the payment provider callback, not from “the user returned to the success page.”

## Step 16: Optional Live Gemini Validation

Only do this after the local baseline is healthy.

You need:

- `GEMINI_API_KEY`

Then validate:

- admin workout draft generation
- admin relaxation draft generation
- mobile workout recommendations
- mobile reset recommendations

### Best Practice

Use a real key only for controlled testing, record what was tested, and rotate or remove the key afterward if it should not stay in local configuration.

## Common Failure Guide

### `corepack pnpm install` fails

Likely cause:

- Node or Corepack setup problem
- network or package manager issue

Action:

- fix toolchain first

### `smoke:setup` fails

Likely cause:

- Postgres is unreachable
- `DATABASE_URL` is wrong
- Prisma schema push failed

Action:

- verify database connectivity before retrying

### `/health` works but `/health/readiness` shows database trouble

Likely cause:

- API process is alive
- database dependency is not healthy

Action:

- fix the database, not the frontend

### Web or admin page loads but login fails

Likely cause:

- seed setup did not run
- database state is inconsistent
- API is not properly connected

Action:

- rerun `corepack pnpm smoke:setup`
- confirm the API is using the expected `.env`

### Smoke AI test returns `503`

Likely cause:

- Gemini key is missing
- AI is intentionally disabled
- provider is unavailable

Action:

- treat it as acceptable only if the response is graceful and matches the documented AI fallback behavior

### Commerce renders but checkout is incomplete

Likely cause:

- real provider keys are missing

Action:

- confirm whether you are doing local baseline testing or live billing acceptance testing

## Suggested Test Evidence To Capture

For each serious test run, keep:

- date and time
- git commit or branch
- `.env` notes, especially provider-key presence
- results of `lint`, `typecheck`, and `build`
- result of `smoke:setup`, or the Postgres connectivity error if setup is blocked
- result of `smoke`, when setup succeeds
- screenshot artifact folder when used after seeded fixtures exist, usually `test-results/screenshots/runs/<timestamp>-<commit>/`
- notes on manual web, admin, and mobile results
- exact failing command and exact error if something breaks

This is a strong software engineering habit because it makes retesting and handoff much easier.

## Recommended “Shortest Useful Test Run”

If you want the fastest meaningful confidence check, use this sequence:

1. `corepack pnpm install`
2. `Copy-Item .env.example .env`
3. confirm Postgres is reachable
4. `corepack pnpm lint`
5. `corepack pnpm typecheck`
6. `corepack pnpm build`
7. `corepack pnpm smoke:setup`
8. `corepack pnpm smoke`
9. `corepack pnpm screenshots`

Then do one short manual pass on:

- web login and account
- admin login and dashboard
- coach restricted-access check
- mobile workout and reset tabs

## Final Takeaway

The best way to test this repo is not to start with random clicking. Start with the documented baseline, use deterministic seed data, trust the readiness checks, and move outward from infrastructure to user experience.

That is the difference between ad hoc testing and software engineering testing.
