-- Hide unpriced (rate_per_1000 = 0) services from customers until an admin prices them.
--
-- The provider sync (server/routes/admin.js) keeps zero-rate provider services and their
-- catalog rows inactive, and order validation refuses to charge $0. This policy is the last
-- line of defense for any catalog row that is somehow still active with no resell price,
-- so customers never see (or are able to select) a "free" service.
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (status = 'active' AND rate_per_1000 > 0);
