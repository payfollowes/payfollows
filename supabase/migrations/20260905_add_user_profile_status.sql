-- Add user_profiles.status so the admin Ban/Unban toggle has a column to persist to.
-- The admin UI (UserManagement.tsx) always rendered a status badge, but the column never
-- existed, so every user showed as "inactive" and toggling did nothing.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_status_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_status_check CHECK (status IN ('active', 'banned', 'inactive'));
  END IF;
END $$;