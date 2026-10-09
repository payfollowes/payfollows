# Security Fixes

## Completed and verified

### Admin authorization guardrails
The code already contains a centralized admin gate in [server/routes/admin.js](../../server/routes/admin.js), which verifies the session token and ensures the caller has an `admin` role before allowing privileged actions.

### FastPay webhook signature validation
The FastPay route in [server/routes/webhook.js](../../server/routes/webhook.js) validates a signature header when a webhook secret is configured and rejects unsigned requests.

### Fail-closed config handling
The Supabase bootstrap in [server/lib/supabaseServer.js](../../server/lib/supabaseServer.js) avoids silently connecting when required env values are missing.

## Remaining production risks
- Secret leakage via [server/.env.local](../../server/.env.local)
- Cron plan restriction in [vercel.json](../../vercel.json)
- Need for durable idempotency ledger for payment webhooks
- Need for explicit deployment env validation and rotation

## Security actions required before production release
1. Remove secrets from repository history or local config.
2. Rotate exposed client/server secrets.
3. Move all production credentials into Vercel environment variables.
4. Keep webhook verification active and require a provider secret in production.
5. Add a database-backed payment-event receipt ledger for exactly-once crediting.
