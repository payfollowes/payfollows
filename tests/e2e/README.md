# PayFollows E2E tests

Offline, deterministic Playwright suites that run against a local **production
build**. No live Supabase, no live Vercel deployment, no network mocking inside
the browser beyond dropping analytics beacons.

## Architecture

```
Chromium (Playwright)
   │  same-origin http://127.0.0.1:3000
   ▼
next start (web, built with web/.env.local)
   │  /rest/v1/*  ──► NEXT_PUBLIC_SUPABASE_URL ──► stub (127.0.0.1:3100)
   │  /api/*      ──► Next rewrite (E2E_API_TARGET) ──► stub (127.0.0.1:3100)
   ▼
node:http stub (stub-server.mjs) — Supabase REST/RPC/auth + legacy /api
```

- **`stub-server.mjs`** — single long-lived `node:http` server on port 3100.
  One stub serves the whole test process; the active role is derived per
  request from the JWT `sub` (`roleFromRequest`), so no per-role restarts
  (restarts raced with Next's keep-alive pool and caused `Failed to fetch`
  flakes). Mutating requests are recorded in `stub.state.mutations` for
  assertions. CORS exposes `content-range` so PostgREST head-counts work
  cross-origin.
- **`mocks.mjs`** — shared stub lifecycle (`startSharedStub` /
  `stopSharedStub` / `resetMutations`), analytics route aborts, and
  `seedSession`, which writes a raw auth-js `Session` (3-part JWT) into the
  localStorage key the app reads.
- **`fixtures.mjs`** — deterministic rows: profiles, services, a drip order
  (5 runs / 60-minute interval), unread notifications, referrals, chat,
  settings, earnings and audit logs.
- **`browser.mjs`** — bootstraps `@sparticuz/chromium` from `/tmp/chromium-pf`
  and attaches console/page-error/request diagnostics.
- **`smoke.mjs`** — anonymous suite (21 checks): landing, a full scroll pass
  asserting every section renders and no scroll-reveal element stays hidden,
  register/login/forgot-password, route guards, 404, mobile overflow, broken
  images. Scroll steps use `behavior:'instant'` because the app ships
  `scroll-behavior:smooth`, which would otherwise animate test jumps and
  never reach deep sections within the waits.
- **`app.mjs`** — authenticated suite (34 checks, user + admin): identity,
  notification bell, referrals, child panels, live chat, drip-feed ordering,
  orders table, balance-trend curve shape, plus admin overview head-counts,
  financials (including rendered bar heights), audit, settings and channel
  management. Mutation assertions poll `waitForMutation` instead of using
  fixed sleeps.
- **`sweep.mjs`** — authenticated route sweep (69 checks): visits all 10
  user and 13 admin routes and asserts each renders content, has no console
  errors/uncaught exceptions/failed requests, and leaks no `NaN`/`undefined`
  text. Catches whole-page crashes and formatter defects the deep-flow suite
  never navigates to.

Screenshots and JSON results land in `artifacts/` (gitignored).

## Running

```bash
# 1. Build the app with the offline env file in place (web/.env.local, gitignored)
cd web && npx next build && npx next start -p 3000 -H 0.0.0.0 &

# 2. From the repo root
node tests/e2e/smoke.mjs           # 21 anonymous checks
node tests/e2e/app.mjs             # 35 authenticated deep-flow checks
node tests/e2e/sweep.mjs           # 69 authenticated route-render checks
                                   # (every dashboard/admin route, NaN guards)
node tests/e2e/smoke.mjs https://payfollows-web.vercel.app   # live URL mode
```

`app.mjs` exits non-zero on any failed check, so it is CI-friendly. Set
`STUB_DEBUG=1` to log count headers and handler errors from the stub.

## Conventions / gotchas

- `innerText` never exposes `<input>` values — assert form state via
  `inputValue()` or `page.evaluate` over `input.value`.
- Radix comboboxes need category-first selection with explicit option waits.
- Never replace the single shared stub with per-role restarts; never drop the
  `access-control-expose-headers` CORS header; `route.fulfill` strips custom
  headers on this Playwright/Chromium combination — the real HTTP stub plus
  Next rewrite is the only working interception pattern here. Both
  `{head:true}` count requests and GETs with a `count=exact` Prefer header
  must answer with `content-range: 0-(N-1)/N`.
- Harness noise (aborted analytics, navigation-driven `ERR_ABORTED`, the
  intentional 404-document check) is filtered explicitly in the diagnostics
  gates.
- Scroll reveals are progressive-enhancement only: the hidden state is applied
  post-hydration via `[data-reveal]` (see `web/src/components/shared/reveal.tsx`
  and globals.css), so SSR/no-JS markup is always visible and framer-motion
  `whileInView` opacity traps can never blank a section.
