# Production Checklist

- [ ] Rotate secrets currently tracked in local config files.
- [ ] Remove or ignore local env files from version control.
- [ ] Configure Vercel environment variables for production.
- [ ] Set correct project root in Vercel.
- [ ] Set app build command to `npm run build`.
- [ ] Set output directory to `dist`.
- [ ] Reduce cron schedule to a single daily run or upgrade plan.
- [ ] Verify webhook secrets are configured and production-only.
- [ ] Validate admin auth and role checks against real tokens.
- [ ] Validate wallet update and ledger invariants.
- [ ] Run final smoke tests after deployment.
