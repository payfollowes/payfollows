-- Fix admin user deletion end to end.
--
-- Two separate problems made the admin "delete user" action fail silently or crash:
--
-- 1. RLS gap: user_profiles had no DELETE (or cross-user UPDATE) policy for admins, so the
--    app's delete via the logged-in client was silently rejected (0 rows affected, no error).
-- 2. handle_new_user() dereferenced NEW.raw_user_meta_data unconditionally. A stray trigger
--    on another table/event (present in some live databases, not in this repo) fired it with a
--    NEW row that has no such field, crashing deletes with
--      record "new" has no field "raw_user_meta_data"
--    and rolling the deletion back. The hardened function below never touches NEW fields
--    unless it really is an AFTER INSERT on auth.users.

-- 1) RLS: allow admins to delete and update any user profile.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
      AND policyname = 'Admins can delete user profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can delete user profiles"
      ON public.user_profiles FOR DELETE
      USING (public.is_admin(auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
      AND policyname = 'Admins can update user profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update user profiles"
      ON public.user_profiles FOR UPDATE
      USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- 2) Hardened profile-creation function. Only ever acts on AFTER INSERT of an auth.users row;
--    any other invocation returns immediately without touching NEW.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT := NULL;
  candidate_username TEXT := NULL;
  counter INT := 0;
  has_raw boolean := false;
  has_user_meta boolean := false;
BEGIN
  -- Never touch NEW.<field> unless this really is an INSERT into auth.users.
  IF TG_OP <> 'INSERT' OR TG_TABLE_SCHEMA <> 'auth' OR TG_TABLE_NAME <> 'users' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- If there is already a profile for this auth user id, do nothing.
  IF EXISTS(SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- If the email is already in use by another profile, abort gracefully without error
  -- to avoid blocking auth.user creation (the dashboard shows a generic DB error)
  IF EXISTS(SELECT 1 FROM public.user_profiles WHERE email = NEW.email AND id <> NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Detect if auth.users has raw_user_meta_data or user_metadata columns
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_user_meta_data') INTO has_raw;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'user_metadata') INTO has_user_meta;

  IF has_raw THEN
    base_username := COALESCE((NEW.raw_user_meta_data->>'username')::text, split_part(NEW.email, '@', 1));
  ELSIF has_user_meta THEN
    base_username := COALESCE((NEW.user_metadata->>'username')::text, split_part(NEW.email, '@', 1));
  ELSE
    base_username := split_part(NEW.email, '@', 1);
  END IF;

  candidate_username := base_username;

  -- Ensure username uniqueness: append a numeric suffix if necessary
  WHILE EXISTS(SELECT 1 FROM public.user_profiles WHERE username = candidate_username) LOOP
    counter := counter + 1;
    candidate_username := base_username || '_' || counter;
  END LOOP;

  INSERT INTO public.user_profiles (id, email, username)
  VALUES (NEW.id, NEW.email, candidate_username);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Drop any stray trigger that executes handle_new_user on a table other than auth.users
--    (these fired the function with a NEW row lacking auth metadata and broke deletions).
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND t.tgfoid = 'public.handle_new_user()'::regprocedure
      AND NOT (n.nspname = 'auth' AND c.relname = 'users')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', trig.trigger_name, trig.schema_name, trig.table_name);
    RAISE NOTICE 'Dropped stray trigger %.% on %.%', trig.schema_name, trig.table_name, trig.schema_name, trig.trigger_name;
  END LOOP;
END $$;

-- 4) Ensure the canonical trigger exists on auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
