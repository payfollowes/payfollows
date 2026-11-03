-- Fix: signup failed with GoTrue 500 "Database error saving new user".
-- Root cause: the on_auth_user_created trigger (and the api_key column DEFAULT
-- via generate_api_key) resolved uuid_generate_v4() through search_path, but the
-- function lives in the `extensions` schema, which was missing from the trigger's
-- effective search_path. The unresolved-function error aborted the whole signup
-- transaction. Fix = pin search_path (incl. extensions) and schema-qualify calls.

-- 1. API key generator: pin path and fully-qualify the extension function
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS text
LANGUAGE plpgsql
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  generated_key TEXT;
BEGIN
  LOOP
    generated_key := 'sk_' || substr(md5(extensions.uuid_generate_v4()::text || clock_timestamp()::text || random()::text), 1, 32);
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE api_key = generated_key
    );
  END LOOP;
  RETURN generated_key;
END;
$$;

-- 2. Admin check: pin path (used inside RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.user_profiles WHERE id = user_id LIMIT 1;
  RETURN user_role = 'admin';
END;
$$;

-- 3. Signup trigger: pin path incl. extensions, keep idempotent + exception-safe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_catalog
AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  counter INT := 0;
BEGIN
  IF TG_OP <> 'INSERT' OR TG_TABLE_SCHEMA <> 'auth' OR TG_TABLE_NAME <> 'users' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF EXISTS(SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF EXISTS(SELECT 1 FROM public.user_profiles WHERE email = NEW.email AND id <> NEW.id) THEN
    RETURN NEW;
  END IF;

  base_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
    split_part(NEW.email, '@', 1)
  );
  candidate_username := base_username;

  WHILE EXISTS(SELECT 1 FROM public.user_profiles WHERE username = candidate_username) LOOP
    counter := counter + 1;
    candidate_username := base_username || '_' || counter;
  END LOOP;

  INSERT INTO public.user_profiles (id, email, username)
  VALUES (NEW.id, NEW.email, candidate_username);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: % (%)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- 4. Recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
