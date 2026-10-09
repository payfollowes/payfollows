# Architecture Changes

## Current architecture posture
The repository uses a modular Express app with route-level logic and server-side Supabase access. This is aligned with a modular monolith and is appropriate for the current scale.

## Observed strengths
- Shared startup and register logic in [server/app.js](../../server/app.js)
- Centralized Supabase client bootstrap in [server/lib/supabaseServer.js](../../server/lib/supabaseServer.js)
- Route-level separation across auth, admin, provider, public, and payment domains

## Recommended architecture follow-ups
- Centralize admin authorization in one shared middleware module.
- Centralize payment-event handling and ledger updates.
- Add explicit service boundaries for wallet service, order service, and fulfillment service.
- Preserve the modular monolith rather than moving to microservices without a concrete need.
