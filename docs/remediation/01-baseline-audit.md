# Baseline Audit

## Scope
This audit reviews the current repo state as checked in the workspace and validates the hardening work already present in the codebase before new changes are introduced.

## Evidence reviewed
- [package.json](../../package.json)
- [vercel.json](../../vercel.json)
- [server/app.js](../../server/app.js)
- [server/index.js](../../server/index.js)
- [server/lib/supabaseServer.js](../../server/lib/supabaseServer.js)
- [server/lib/authCookies.js](../../server/lib/authCookies.js)
- [server/routes/admin.js](../../server/routes/admin.js)
- [server/routes/webhook.js](../../server/routes/webhook.js)
- [server/routes/provider.js](../../server/routes/provider.js)
- [server/routes/services.js](../../server/routes/services.js)
- [server/routes/publicServices.js](../../server/routes/publicServices.js)
- [server/routes/fastpay.js](../../server/routes/fastpay.js)
- [src/lib/api.ts](../../src/lib/api.ts)
- [supabase/schema.sql](../../supabase/schema.sql)

## Findings

### Issue ID: PAY-001
**Severity:** CRITICAL  
**Original location:** [server/routes/webhook.js](../../server/routes/webhook.js)  
**Status:** Confirmed / partially remediated  
**Root cause:** FastPay webhooks are being checked against a shared secret when configured, but the server uses parsed JSON body values and does not maintain a durable idempotency ledger at the database layer.  
**Impact:** Payment replay or replayed callback confusion can still occur if duplicate webhooks arrive concurrently and no ledger is enforced in the database.  
**Repair:** Keep signature verification in place and add an idempotent payment-event ledger before final balance credits are applied.  
**Dependencies:** database migration required; event receipt table or unique constraint on provider transaction ID.  

### Issue ID: PAY-002
**Severity:** CRITICAL  
**Original location:** [server/routes/admin.js](../../server/routes/admin.js)  
**Status:** Confirmed / partially remediated  
**Root cause:** Administrative endpoints are protected by a role check and token validation, but sensitive service-role operations must remain guarded by server-side authorization middleware with explicit active-user and admin-role checks.  
**Impact:** If a route bypasses the shared middleware or a non-admin token is accepted, service-role operations may be reachable.  
**Repair:** Keep the admin middleware centralized and use it consistently on all mutation routes.  
**Dependencies:** review of all route registrations and any future admin route additions.  

### Issue ID: PAY-003
**Severity:** CRITICAL  
**Original location:** [server/lib/supabaseServer.js](../../server/lib/supabaseServer.js)  
**Status:** Confirmed / partially remediated  
**Root cause:** The project automatically pulls Supabase values from environment variables and warns when service role keys are absent, but production deployments must still fail closed if required secrets are missing.  
**Impact:** A misconfigured environment can leave the application partially alive without a functioning secure backend.  
**Repair:** Fail closed for privileged operations and ensure deployment env validation happens before runtime service activation.  
**Dependencies:** Vercel env validation and deployment smoke tests.  

### Issue ID: PAY-004
**Severity:** HIGH  
**Original location:** [vercel.json](../../vercel.json)  
**Status:** Confirmed  
**Root cause:** Cron schedule uses `0 */6 * * *`, which runs four times per day. Hobby accounts are limited to one daily cron run.  
**Impact:** Vercel rejects the cron in a Hobby plan because the schedule exceeds the daily limit.  
**Repair:** Reduce the schedule to a daily cadence or upgrade to a plan that supports multiple cron jobs.  
**Dependencies:** plan change or cron rewrite.  

### Issue ID: PAY-005
**Severity:** HIGH  
**Original location:** [server/.env.local](../../server/.env.local)  
**Status:** Confirmed  
**Root cause:** Secret values are present in a checked-in local env file.  
**Impact:** This is a security exposure and must never be committed to a public repository.  
**Repair:** Remove production secrets from the repo, rotate them, and use Vercel environment variables instead.  
**Dependencies:** secret rotation and Vercel project env setup.  

### Issue ID: PAY-006
**Severity:** MEDIUM  
**Original location:** [server/lib/authCookies.js](../../server/lib/authCookies.js)  
**Status:** Confirmed / partially remediated  
**Root cause:** Cookie security settings exist and are configurable, but the final effective security posture must be validated in production and against browser credentialed requests.  
**Impact:** Session fixation or leakage risk increases if cookies are served without proper secure/same-site settings in host-specific deployment.  
**Repair:** Validate cookie config and ensure only approved origins and secure transports are used in production.  
**Dependencies:** deployment validation and environment configuration.  

## Baseline conclusion
The codebase already contains several security-hardening measures, especially in the admin auth and FastPay webhook paths. However, there are still production and compliance gaps that need to be validated before release: plan-limited cron settings, secret sprawl in local env files, and the need for a durable event ledger and stricter deployment env checks.
