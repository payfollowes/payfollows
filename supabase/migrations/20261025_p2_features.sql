-- P2 feature pack: drip-feed orders, notifications, referrals, child panels,
-- audit logs and persisted platform settings. Rollback-safe on failure.

-- ===========================================================================
-- 1. Drip-feed columns on orders
-- ===========================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_dripfeed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS runs INTEGER,
  ADD COLUMN IF NOT EXISTS interval_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS runs_delivered INTEGER NOT NULL DEFAULT 0;

-- ===========================================================================
-- 2. Referral + child-panel columns on user_profiles
-- ===========================================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.user_profiles(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_profiles_referral_code
  ON public.user_profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON public.user_profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_id ON public.user_profiles(parent_id);

-- Human-shareable code, e.g. PF4F8A2C19. Collision-free uniqueness is enforced
-- by the partial unique index; callers retry on conflict.
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE sql
SET search_path = public, extensions
AS $$
  SELECT 'PF' || upper(substr(md5(gen_random_uuid()::text), 1, 8));
$$;

-- Backfill codes for profiles created before this migration.
DO $$
DECLARE
  v_profile RECORD;
  v_code TEXT;
BEGIN
  FOR v_profile IN SELECT id FROM public.user_profiles WHERE referral_code IS NULL LOOP
    LOOP
      v_code := public.generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = v_code);
    END LOOP;
    UPDATE public.user_profiles SET referral_code = v_code WHERE id = v_profile.id;
  END LOOP;
END $$;

-- ===========================================================================
-- 3. New tables
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'order', 'payment', 'system', 'referral', 'support', 'child')),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trigger_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  reward_amount NUMERIC(12, 2) NOT NULL CHECK (reward_amount >= 0),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One reward per referred account, ever.
  UNIQUE (referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON public.referral_rewards(referrer_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- ===========================================================================
-- 4. Helper functions
-- ===========================================================================
-- Read one value from the singleton platform settings row.
CREATE OR REPLACE FUNCTION public.get_platform_setting(p_key TEXT, p_default JSONB DEFAULT 'null'::jsonb)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT COALESCE((SELECT config -> p_key FROM public.app_settings WHERE id = 'platform'), p_default);
$$;

-- SECURITY DEFINER so RLS policies can call it without recursive self-scans.
CREATE OR REPLACE FUNCTION public.is_my_child(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_user_id AND parent_id = auth.uid()
  );
$$;

-- ===========================================================================
-- 5. Signup trigger: referral code, referrer attribution and child linking
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_username TEXT := NULL;
  candidate_username TEXT := NULL;
  counter INT := 0;
  has_raw boolean := false;
  has_user_meta boolean := false;
  v_code TEXT;
  v_referrer UUID;
  v_parent UUID;
  v_meta JSONB;
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

  SELECT EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_user_meta_data') INTO has_raw;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'user_metadata') INTO has_user_meta;

  IF has_raw THEN
    v_meta := NEW.raw_user_meta_data;
    base_username := COALESCE((NEW.raw_user_meta_data->>'username')::text, split_part(NEW.email, '@', 1));
  ELSIF has_user_meta THEN
    v_meta := NEW.user_metadata;
    base_username := COALESCE((NEW.user_metadata->>'username')::text, split_part(NEW.email, '@', 1));
  ELSE
    v_meta := '{}'::jsonb;
    base_username := split_part(NEW.email, '@', 1);
  END IF;

  candidate_username := base_username;
  WHILE EXISTS(SELECT 1 FROM public.user_profiles WHERE username = candidate_username) LOOP
    counter := counter + 1;
    candidate_username := base_username || '_' || counter;
  END LOOP;

  -- Unique referral code for the new account.
  LOOP
    v_code := public.generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = v_code);
  END LOOP;

  -- Referrer attribution (never self, code lookup is case-insensitive).
  v_referrer := NULL;
  IF v_meta ? 'referral_code' AND length(trim(COALESCE(v_meta->>'referral_code', ''))) > 0 THEN
    SELECT id INTO v_referrer
    FROM public.user_profiles
    WHERE upper(referral_code) = upper(trim(v_meta->>'referral_code'))
      AND id <> NEW.id
    LIMIT 1;
  END IF;

  -- Child panel link uses the same code namespace.
  v_parent := NULL;
  IF v_meta ? 'child_code' AND length(trim(COALESCE(v_meta->>'child_code', ''))) > 0 THEN
    SELECT id INTO v_parent
    FROM public.user_profiles
    WHERE upper(referral_code) = upper(trim(v_meta->>'child_code'))
      AND id <> NEW.id
    LIMIT 1;
  END IF;

  INSERT INTO public.user_profiles (id, email, username, referral_code, referred_by, parent_id)
  VALUES (NEW.id, NEW.email, candidate_username, v_code, v_referrer, v_parent);

  RETURN NEW;
END;
$$;

-- ===========================================================================
-- 6. Order RPCs gain drip-feed parameters (appended to preserve call positions)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.place_order_for_user(
  p_user_id UUID,
  p_service_id UUID,
  p_link TEXT,
  p_quantity INTEGER,
  p_delivery_time INTEGER DEFAULT 24,
  p_provider_id UUID DEFAULT NULL,
  p_provider_order_id TEXT DEFAULT NULL,
  p_runs INTEGER DEFAULT NULL,
  p_interval_minutes INTEGER DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
  v_service public.services%ROWTYPE;
  v_rate NUMERIC;
  v_charge NUMERIC(12, 2);
  v_order public.orders%ROWTYPE;
  v_balance_after NUMERIC(12, 2);
  v_is_dripfeed BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_profile
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF v_profile.status = 'banned' THEN
    RAISE EXCEPTION 'Account is banned';
  END IF;
  IF v_profile.status <> 'active' THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;
  IF p_link IS NULL OR length(trim(p_link)) = 0 THEN
    RAISE EXCEPTION 'Please enter your content link';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  v_is_dripfeed := p_runs IS NOT NULL AND p_runs > 1;
  IF v_is_dripfeed THEN
    IF p_runs < 2 OR p_runs > 100000 THEN
      RAISE EXCEPTION 'Drip-feed runs must be between 2 and 100000';
    END IF;
    IF p_interval_minutes IS NULL OR p_interval_minutes < 1 OR p_interval_minutes > 10080 THEN
      RAISE EXCEPTION 'Drip-feed interval must be between 1 minute and 7 days';
    END IF;
  END IF;

  SELECT * INTO v_service FROM public.services WHERE id = p_service_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  IF v_service.status <> 'active' THEN
    RAISE EXCEPTION 'Service is not available';
  END IF;
  IF p_quantity < v_service.min_quantity OR p_quantity > v_service.max_quantity THEN
    RAISE EXCEPTION 'Quantity must be between % and %',
      v_service.min_quantity, v_service.max_quantity;
  END IF;

  SELECT ps.our_rate INTO v_rate
  FROM public.provider_services ps
  WHERE ps.service_id = p_service_id
    AND ps.status = 'active'
    AND ps.our_rate > 0
  ORDER BY ps.updated_at DESC
  LIMIT 1;

  v_rate := COALESCE(v_rate, v_service.rate_per_1000);
  IF v_rate IS NULL OR v_rate <= 0 THEN
    RAISE EXCEPTION 'This service has not been priced yet. Please contact support.';
  END IF;

  v_charge := round((v_rate / 1000.0) * p_quantity, 2);

  IF v_profile.balance < v_charge THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO public.orders (
    user_id, service_id, provider_id, provider_order_id,
    link, quantity, charge, delivery_time, status,
    is_dripfeed, runs, interval_minutes, runs_delivered
  )
  VALUES (
    p_user_id, p_service_id, p_provider_id, p_provider_order_id,
    trim(p_link), p_quantity, v_charge, COALESCE(p_delivery_time, 24), 'pending',
    v_is_dripfeed, CASE WHEN v_is_dripfeed THEN p_runs ELSE NULL END,
    CASE WHEN v_is_dripfeed THEN p_interval_minutes ELSE NULL END, 0
  )
  RETURNING * INTO v_order;

  UPDATE public.user_profiles
     SET balance = balance - v_charge,
         total_spent = total_spent + v_charge,
         updated_at = now()
   WHERE id = p_user_id
  RETURNING balance INTO v_balance_after;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  )
  VALUES (
    p_user_id, 'order_debit', -v_charge, v_balance_after,
    'order', v_order.id, 'Order ' || substr(v_order.id::text, 1, 8)
  );

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_order(
  p_service_id UUID,
  p_link TEXT,
  p_quantity INTEGER,
  p_delivery_time INTEGER DEFAULT 24,
  p_provider_id UUID DEFAULT NULL,
  p_provider_order_id TEXT DEFAULT NULL,
  p_runs INTEGER DEFAULT NULL,
  p_interval_minutes INTEGER DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  RETURN public.place_order_for_user(
    auth.uid(),
    p_service_id,
    p_link,
    p_quantity,
    COALESCE(p_delivery_time, 24),
    p_provider_id,
    p_provider_order_id,
    p_runs,
    p_interval_minutes
  );
END;
$$;

-- ===========================================================================
-- 7. Child panel RPCs
-- ===========================================================================
-- Existing user links themselves to a panel owner via the owner's code.
CREATE OR REPLACE FUNCTION public.attach_to_parent(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_parent UUID;
  v_current public.user_profiles%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RAISE EXCEPTION 'Invite code is required';
  END IF;

  SELECT * INTO v_current FROM public.user_profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF v_current.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'This account is already linked to a panel owner';
  END IF;

  SELECT id INTO v_parent
  FROM public.user_profiles
  WHERE upper(referral_code) = upper(trim(p_code))
    AND id <> v_user_id
  LIMIT 1;

  IF v_parent IS NULL THEN
    RAISE EXCEPTION 'Invite code not found';
  END IF;
  -- No cycles: the target must not be a descendant (here: a child) of ours.
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = v_parent AND parent_id = v_user_id) THEN
    RAISE EXCEPTION 'Invalid panel link';
  END IF;

  UPDATE public.user_profiles SET parent_id = v_parent, updated_at = now()
  WHERE id = v_user_id;

  RETURN v_parent;
END;
$$;

-- Panel owner moves wallet balance to one of their child accounts.
CREATE OR REPLACE FUNCTION public.transfer_to_child(p_child_id UUID, p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_amount NUMERIC(12, 2);
  v_parent public.user_profiles%ROWTYPE;
  v_child public.user_profiles%ROWTYPE;
  v_parent_after NUMERIC(12, 2);
  v_child_after NUMERIC(12, 2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  v_amount := round(p_amount, 2);
  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  SELECT * INTO v_parent FROM public.user_profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT * INTO v_child
  FROM public.user_profiles
  WHERE id = p_child_id AND parent_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child account not found';
  END IF;

  IF v_parent.balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient balance for this transfer';
  END IF;

  UPDATE public.user_profiles
     SET balance = balance - v_amount, updated_at = now()
   WHERE id = v_user_id
  RETURNING balance INTO v_parent_after;

  UPDATE public.user_profiles
     SET balance = balance + v_amount, updated_at = now()
   WHERE id = v_child.id
  RETURNING balance INTO v_child_after;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  ) VALUES (
    v_user_id, 'child_transfer_out', -v_amount, v_parent_after,
    'user', v_child.id, 'Transfer to child ' || v_child.username
  );

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  ) VALUES (
    v_child.id, 'child_transfer_in', v_amount, v_child_after,
    'user', v_user_id, 'Funds from panel owner ' || v_parent.username
  );

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (v_user_id, 'Child transfer sent',
          'You transferred ' || v_amount::text || ' USD to ' || v_child.username,
          'child', '/dashboard/child-panels');

  RETURN v_parent_after;
END;
$$;

-- ===========================================================================
-- 8. Referral reward: credit the referrer on the referred user's first deposit
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.process_referral_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_referrer UUID;
  v_reward NUMERIC(12, 2);
  v_balance_after NUMERIC(12, 2);
  v_reward_id UUID;
  v_enabled BOOLEAN;
BEGIN
  IF TG_OP <> 'UPDATE' OR NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  v_enabled := COALESCE(public.get_platform_setting('referral_reward_enabled', 'true'::jsonb)::boolean, true);
  IF NOT v_enabled THEN
    RETURN NEW;
  END IF;

  SELECT referred_by INTO v_referrer
  FROM public.user_profiles
  WHERE id = NEW.user_id;

  IF v_referrer IS NULL THEN
    RETURN NEW;
  END IF;

  -- One reward per referred account.
  IF EXISTS (SELECT 1 FROM public.referral_rewards WHERE referred_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  v_reward := round(
    COALESCE(public.get_platform_setting('referral_reward_amount', '2'::jsonb)::numeric, 2.00),
    2
  );
  IF v_reward <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.referral_rewards (referrer_id, referred_id, trigger_payment_id, reward_amount)
  VALUES (v_referrer, NEW.user_id, NEW.id, v_reward)
  RETURNING id INTO v_reward_id;

  UPDATE public.user_profiles
     SET balance = balance + v_reward, updated_at = now()
   WHERE id = v_referrer
  RETURNING balance INTO v_balance_after;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  ) VALUES (
    v_referrer, 'referral_reward', v_reward, v_balance_after,
    'referral', v_reward_id, 'Referral reward for a referred deposit'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_on_payment ON public.payments;
CREATE TRIGGER trg_referral_on_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.process_referral_on_payment();

-- ===========================================================================
-- 9. Notification triggers
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'Order ' || NEW.status,
      'Order ' || substr(NEW.id::text, 1, 8) || ' is now ' || NEW.status,
      'order',
      '/dashboard/orders'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_order_status ON public.orders;
CREATE TRIGGER trg_notify_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

CREATE OR REPLACE FUNCTION public.notify_wallet_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_title TEXT;
  v_type TEXT;
BEGIN
  v_title := CASE NEW.type
    WHEN 'deposit' THEN 'Deposit confirmed'
    WHEN 'refund' THEN 'Refund received'
    WHEN 'referral_reward' THEN 'Referral reward'
    WHEN 'child_transfer_in' THEN 'Funds received from panel owner'
    ELSE NULL
  END;

  IF v_title IS NULL THEN
    RETURN NEW;
  END IF;

  v_type := CASE WHEN NEW.type LIKE 'referral%' THEN 'referral'
                 WHEN NEW.type = 'child_transfer_in' THEN 'child'
                 ELSE 'payment' END;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    NEW.user_id, v_title,
    NEW.description || ' — ' || to_char(abs(NEW.amount), 'FM999999990.00') || ' USD',
    v_type, '/dashboard/add-funds'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_wallet ON public.balance_transactions;
CREATE TRIGGER trg_notify_wallet
  AFTER INSERT ON public.balance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_wallet_movement();

-- Explicit notification RPC for server-side / service-role events.
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.notifications%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_title IS NULL THEN
    RAISE EXCEPTION 'user id and title are required';
  END IF;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (p_user_id, p_title, p_body, COALESCE(p_type, 'info'), p_link)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- ===========================================================================
-- 10. Audit log triggers (definer-owned writes bypass RLS by design)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.write_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id TEXT;
  v_metadata JSONB := '{}'::jsonb;
  v_actor UUID := auth.uid();
  v_role TEXT;
BEGIN
  v_id := COALESCE(NEW.id, OLD.id)::text;

  IF TG_TABLE_NAME = 'user_profiles' THEN
    -- Never log secrets such as api_key; keep only the governed fields.
    v_metadata := jsonb_build_object(
      'before', jsonb_build_object(
        'role', OLD.role, 'status', OLD.status,
        'parent_id', OLD.parent_id, 'referred_by', OLD.referred_by),
      'after', jsonb_build_object(
        'role', NEW.role, 'status', NEW.status,
        'parent_id', NEW.parent_id, 'referred_by', NEW.referred_by)
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_metadata := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'INSERT' THEN
    v_metadata := jsonb_build_object('new', to_jsonb(NEW));
  ELSE
    v_metadata := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  SELECT role INTO v_role FROM public.user_profiles WHERE id = v_actor;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor, COALESCE(v_role, 'system'),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME, v_id, v_metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_margin_rules ON public.provider_margin_rules;
CREATE TRIGGER trg_audit_margin_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.provider_margin_rules
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_settings ON public.app_settings;
CREATE TRIGGER trg_audit_settings
  AFTER INSERT OR UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_profiles ON public.user_profiles;
CREATE TRIGGER trg_audit_profiles
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  WHEN (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.parent_id IS DISTINCT FROM OLD.parent_id
    OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
  )
  EXECUTE FUNCTION public.write_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_orders ON public.orders;
CREATE TRIGGER trg_audit_orders
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.write_audit_trigger();

-- Application-level audit events (e.g. key rotation, admin actions).
CREATE OR REPLACE FUNCTION public.write_audit(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_role TEXT;
  v_id UUID;
BEGIN
  IF p_action IS NULL THEN
    RAISE EXCEPTION 'action is required';
  END IF;
  SELECT role INTO v_role FROM public.user_profiles WHERE id = v_actor;
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (v_actor, COALESCE(v_role, 'system'), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ===========================================================================
-- 11. RLS policies
-- ===========================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Notifications
DROP POLICY IF EXISTS "Users view their own notifications" ON public.notifications;
CREATE POLICY "Users view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users mark their own notifications" ON public.notifications;
CREATE POLICY "Users mark their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all notifications" ON public.notifications;
CREATE POLICY "Admins view all notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins send notifications" ON public.notifications;
CREATE POLICY "Admins send notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Referral rewards: a user sees only their own rewards.
DROP POLICY IF EXISTS "Users view their own referral rewards" ON public.referral_rewards;
CREATE POLICY "Users view their own referral rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Admins view all referral rewards" ON public.referral_rewards;
CREATE POLICY "Admins view all referral rewards"
  ON public.referral_rewards FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Audit logs: admin-only visibility; writes happen through definer triggers/RPC.
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Platform settings: world-readable (no secrets stored), admin-managed.
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage app settings" ON public.app_settings;
CREATE POLICY "Admins manage app settings"
  ON public.app_settings FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Child-panel visibility for panel owners.
DROP POLICY IF EXISTS "Parents view child profiles" ON public.user_profiles;
CREATE POLICY "Parents view child profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_my_child(id));

DROP POLICY IF EXISTS "Parents view child orders" ON public.orders;
CREATE POLICY "Parents view child orders"
  ON public.orders FOR SELECT
  USING (public.is_my_child(user_id));

DROP POLICY IF EXISTS "Parents view child ledger" ON public.balance_transactions;
CREATE POLICY "Parents view child ledger"
  ON public.balance_transactions FOR SELECT
  USING (public.is_my_child(user_id));

-- Referrers can read the profiles of accounts they referred (referred_by is
-- independent of the parent/child panel link, so is_my_child does not cover it).
DROP POLICY IF EXISTS "Referrers view referred profiles" ON public.user_profiles;
CREATE POLICY "Referrers view referred profiles"
  ON public.user_profiles FOR SELECT
  USING (referred_by = auth.uid());

-- ===========================================================================
-- 12. Seed platform settings
-- ===========================================================================
INSERT INTO public.app_settings (id, config)
VALUES (
  'platform',
  jsonb_build_object(
    'site_name', 'PayFollows',
    'support_email', 'support@payfollows.com',
    'min_deposit', 5,
    'processing_fee_pct', 2,
    'maintenance', false,
    'new_orders', true,
    'auto_sync', true,
    'email_alerts', true,
    'referral_reward_enabled', true,
    'referral_reward_amount', 2
  )
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- 13. Realtime + grants
-- ===========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.place_order_for_user(UUID, UUID, TEXT, INTEGER, INTEGER, UUID, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_for_user(UUID, UUID, TEXT, INTEGER, INTEGER, UUID, TEXT, INTEGER, INTEGER)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.place_order(UUID, TEXT, INTEGER, INTEGER, UUID, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, TEXT, INTEGER, INTEGER, UUID, TEXT, INTEGER, INTEGER)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT)
  TO service_role;

GRANT EXECUTE ON FUNCTION public.attach_to_parent(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_to_child(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.write_audit(TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_my_child(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_setting(TEXT, JSONB) TO authenticated, anon;
