# Migration and Rollback

## Planned migration work
1. Add payment-event receipt ledger for duplicate prevention.
2. Add DB constraints for idempotent processing keys.
3. Add index coverage for order and payment lookups.
4. Validate wallet balance update paths in a staging environment.

## Rollback guidance
- Keep older schema intact until migration validation is complete.
- Use additive migrations rather than destructive edits.
- If a production deployment fails, revert to the last known-good image or build and restore the prior env values.
- Document exact rollback commands before production release.
