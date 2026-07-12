# PayFollows Audit Blueprint

## 1. Requirements recap

This repository is a reseller SMM panel with a React + TypeScript + Vite frontend, a Node/Express server, Supabase persistence, FastPay payment flows, and admin/user dashboard experiences.

Core capability areas to preserve during hardening:
- Authentication and session handling for users and admins.
- Balance/wallet management and funding flows.
- Service catalog, order placement, and order status tracking.
- Admin tooling for services, providers, payouts, earnings, announcements, and support.
- Server-side integration with FastPay and webhook handling.
- Supabase-backed data storage with row-level security and admin server-side access.

## 2. Repo inventory and expected structure

Expected directories and what should live there:
- src/components/: presentational UI building blocks, section components, layout wrappers.
- src/lib/: data access helpers, API wrappers, auth/session utilities, provider integrations.
- src/pages/: route-level screens for landing, login/registration, dashboard, and admin panels.
- src/pages/dashboard/: user-facing dashboard screens.
- src/pages/admin/: admin-only screens.
- src/types/: shared TypeScript types and generated Supabase type declarations.
- server/: Express bootstrap, route modules, shared server utilities.
- supabase/: SQL schema, migrations, and setup scripts.

What the current repo already contains:
- The expected directory structure is largely present.
- The frontend has a broad admin dashboard surface and a user dashboard split.
- The server has multiple route modules covering services, auth, admin, payments, provider, integrations, fastpay, and webhooks.

Likely issues to inspect next:
- Duplicate or overlapping components under src/components/ and src/pages/ that may be dead or partially orphaned.
- Route-level files that are imported but no longer used by the app shell or hash routing.
- Asset bundles under src/assets/ that may have been introduced for demo content and are no longer referenced.
- Large admin route modules that should be split to improve maintainability and reduce bundle overhead.

## 3. Security architecture review plan

Supabase and auth checks should be audited per table and per trust boundary:
- user_profiles: ensure profile creation and role assignment are server-side controlled; validate that admin escalation cannot be triggered by untrusted client input.
- services: public read access should be limited to the intended public endpoints; admin mutation routes should enforce role checks server-side.
- orders: users should only access their own orders; admin routes should be segregated and backed by server-side role checks.
- payments: payment creation and status updates should only be performed through trusted server routes and webhooks.
- providers: provider credentials and secrets must never be exposed to the client bundle.
- payment_logs: administrative access should be restricted to admin role and server-side functions.

Environment separation audit:
- VITE_* variables are client-safe and should not contain service-role keys or webhook secrets.
- Server-only values such as SUPABASE_SERVICE_ROLE_KEY, FASTPAY_API_KEY, and FASTPAY_WEBHOOK_SECRET must be injected only in the server environment.
- The current repo should be reviewed for any accidental leakage of service-role or private credentials into VITE-prefixed names or frontend-only config.

Admin-role escalation trigger audit:
- Review the flow from auth.users to user_profiles and the role assignment logic in the create-admin helper and any auth callback or trigger scripts.
- Ensure profile role changes are not reachable from a malformed client-side request or from an untrusted API endpoint.

## 4. API contract review plan

Server endpoints should be reviewed for auth middleware, rate limiting, and input validation.

Priority endpoints:
- /api/admin/me
- /api/auth/*
- /api/fastpay/*
- /webhook/fastpay and /api/webhook/fastpay
- /api/provider/*
- /api/payments/*
- /api/admin/*

What should be checked:
- Authorization and admin-role enforcement on admin routes.
- Rate limiting and abuse protection on public endpoints.
- Consistent error envelopes using the existing apiResponse helpers.
- Validation using zod schemas or explicit guard clauses before DB writes.
- Safe handling of malformed webhook payloads and missing secret configuration.

## 5. Data architecture review checklist

Schema review priorities:
- Ensure foreign keys exist where business logic depends on them.
- Verify indexes exist on user_id, status, created_at, provider_id, and transaction_id fields for orders and payments.
- Review constraint tensions that could cause failures during profile creation, such as duplicate username/email conflicts or missing profile rows.
- Confirm that the schema and migrations are idempotent and compatible for repeat deployments.
- Review whether the trigger for auth.user -> user_profiles inserts can fail under duplicate profile conditions and whether the recovery path is clear.

## 6. Environment/config strategy

Local development:
- Keep Vite client variables in .env.local or .env.local at the repo root for frontend usage.
- Keep server-only values in server/.env.local or host env vars for the Node/Express process.

Deployment config:
- The frontend build should only consume client-safe variables.
- The server runtime should receive server-only secrets.
- A config validation script should check for missing variables and flag accidental exposure of secrets to VITE_* variables.

## 7. Deployment target decision matrix

Option A: single Node server hosting frontend + API
- Pros: aligns well with the current express app and Vercel-compatible serverless fallback.
- Cons: requires careful routing and production environment handling.
- Best fit if the project needs a single deployable service with static asset serving and API routes.

Option B: split frontend + API
- Pros: cleaner isolation of secrets and runtime scaling.
- Cons: requires separate deployment and DNS setup.
- Best fit if the team wants stronger separation of concerns.

Recommendation:
- Keep the current Express server as the API foundation.
- Deploy frontend build output to a static host or Vercel frontend project when the app is stable.
- Keep the API server on a Node-capable platform or Vercel serverless-compatible route layer if the server logic is simplified.

## 8. Roadmap

Phase 1 — Audit and stabilization
- Confirm build health and fix obvious compile/runtime issues.
- Inventory dead files, duplicate components, and unused assets.
- Identify missing env vars and security hardening gaps.

Phase 2 — Fixes and cleanup
- Remove duplicates and fix JSX/TypeScript issues.
- Refactor large modules into smaller pieces.
- Introduce stricter env separation and config validation.

Phase 3 — Hardening
- Add rate limiting, request validation, and consistent error handling.
- Review RLS policies and server-side role checks.
- Harden FastPay webhook verification and admin routes.

Phase 4 — Deploy
- Configure environment variables for the target platform.
- Run a production build.
- Validate health checks, auth flows, and payment flow smoke tests.
