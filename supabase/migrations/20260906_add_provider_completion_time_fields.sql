-- Description: Provider completion-time support.
-- 1. completion_time_text      – provider's verbatim label (e.g. "57 minutes", "2 hours 12 minutes"),
--                                scraped from the provider's public services page (their API exposes
--                                no delivery times). Shown verbatim to customers when present.
-- 2. completion_time_override  – admin marked this provider service's time as a manual override;
--                                the sync must not clobber it.
-- 3. completion_time_override_hours – the admin-set manual value in hours (mirrored onto
--                                services.completion_time so customers and ordering see it).
ALTER TABLE public.provider_services
  ADD COLUMN IF NOT EXISTS completion_time_text TEXT,
  ADD COLUMN IF NOT EXISTS completion_time_override BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completion_time_override_hours INTEGER;