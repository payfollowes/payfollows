# Financial Integrity Remediation

## Current status
The project has significant financial protection logic in place, but several concurrency and ledger safeguards still need formal enforcement.

### Observed strengths
- Wallet and payment updates are routed through server-side code paths instead of allowing arbitrary frontend edits.
- Admin-only operations are role-gated in [server/routes/admin.js](../../server/routes/admin.js).
- FastPay webhook protection is present in [server/routes/webhook.js](../../server/routes/webhook.js).

### Remaining gaps
- No durable idempotency ledger for duplicate payment events.
- No explicit database transaction boundary around payment crediting and user balance updates.
- Secret-bearing local env files should be removed.

## Recommended remediation
1. Add a payment_event_receipts table with unique constraint on payment id + provider event id.
2. Use transactional balance updates atomic to the wallet table.
3. Reject duplicate callbacks before crediting funds.
4. Add reconciliation and manual-review logic for unknown or mismatched provider events.
