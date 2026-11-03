-- ============================================================================
-- Wallet security hardening
-- 2026-10-25
--
-- Problem being fixed:
--   1. The "Users can update their own profile" RLS policy let any
--      authenticated user UPDATE every column of their own row directly via
--      PostgREST, including balance, role, total_spent and api_key
--      (self-credit / privilege escalation).
--   2. Order placement was two separate client writes (insert order, then
--      update balance), allowing double-spend races and partial failures.
--   3. There was no audit trail explaining balance changes.
--
-- Fix:
--   * balance_transactions ledger (append-only via SECURITY DEFINER RPCs)
--   * users lose direct UPDATE on user_profiles; admins keep non-financial
--     fields only, money moves exclusively through dedicated RPCs
--   * place_order / admin_set_balance / refund_order / credit_deposit run
--     atomically inside the database with row-level locks
-- ============================================================================

-- 1. Ledger table ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'deposit', 'order_debit', 'refund', 'admin_adjustment', 'referral_bonus'
  )),
  amount DECIMAL(12, 2) NOT NULL,                 -- signed: + credit, - debit
  balance_after DECIMAL(12, 2) NOT NULL,
  reference_type TEXT,                            -- 'payment' | 'order' | 'manual'
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_balance_tx_user
  ON public.balance_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_tx_ref
  ON public.balance_transactions (reference_type, reference_id);

ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.balance_transactions'::regclass
      AND polname = 'Users view own ledger entries'
  ) THEN
    CREATE POLICY "Users view own ledger entries" ON public.balance_transactions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.balance_transactions'::regclass
      AND polname = 'Admins view all ledger entries'
  ) THEN
    CREATE POLICY "Admins view all ledger entries" ON public.balance_transactions
      FOR SELECT USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- No client (anon/authenticated) can ever write the ledger directly.
-- Only SECURITY DEFINER functions (owner privileges) may insert rows.
REVOKE INSERT, UPDATE, DELETE ON public.balance_transactions FROM anon, authenticated;

-- 2. Lock down user_profiles -------------------------------------------------
-- Regular users get NO update policy at all: profile rows are created by the
-- auth trigger and every legitimate change goes through an RPC below.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Admins keep a broad update policy for role/status/user management. A guard
-- trigger below stops even authenticated-role direct writes to financial
-- columns, so money can only move through the SECURITY DEFINER RPCs (which run
-- as the table owner, not as the `authenticated` role).
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.user_profiles'::regclass
      AND polname = 'Admins can update user profiles'
  ) THEN
    CREATE POLICY "Admins can update user profiles" ON public.user_profiles
      FOR UPDATE
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Orders must be created through place_order() so a charge can never be
-- bypassed. Direct user inserts are removed; admin policies stay untouched.
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Defense-in-depth: PostgREST callers use the `authenticated`/`anon` roles;
-- wallet RPCs are SECURITY DEFINER and execute as the owner, so this trigger
-- blocks tampering without breaking the legitimate RPC paths.
CREATE OR REPLACE FUNCTION public.guard_sensitive_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
       NEW.balance IS DISTINCT FROM OLD.balance
    OR NEW.total_spent IS DISTINCT FROM OLD.total_spent
    OR NEW.api_key IS DISTINCT FROM OLD.api_key
  ) THEN
    RAISE EXCEPTION 'Financial fields can only be changed through wallet operations'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_sensitive_profile_fields ON public.user_profiles;
CREATE TRIGGER trg_guard_sensitive_profile_fields
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_sensitive_profile_fields();

-- 3. Atomic money operations -------------------------------------------------

-- 3.1 Place an order: validate, price, debit, ledger, all in one transaction.
CREATE OR REPLACE FUNCTION public.place_order(
  p_service_id UUID,
  p_link TEXT,
  p_quantity INTEGER,
  p_delivery_time INTEGER DEFAULT 24,
  p_provider_id UUID DEFAULT NULL,
  p_provider_order_id TEXT DEFAULT NULL
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_profile
  FROM public.user_profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF v_profile.status = 'banned' THEN
    RAISE EXCEPTION 'Account is banned';
  END IF;
  IF p_link IS NULL OR length(trim(p_link)) = 0 THEN
    RAISE EXCEPTION 'Please enter your content link';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
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

  -- Margin-managed provider rate wins when configured; otherwise catalog rate.
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
    link, quantity, charge, delivery_time, status
  )
  VALUES (
    auth.uid(), p_service_id, p_provider_id, p_provider_order_id,
    trim(p_link), p_quantity, v_charge, COALESCE(p_delivery_time, 24), 'pending'
  )
  RETURNING * INTO v_order;

  UPDATE public.user_profiles
     SET balance = balance - v_charge,
         total_spent = total_spent + v_charge,
         updated_at = now()
   WHERE id = auth.uid()
  RETURNING balance INTO v_balance_after;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  )
  VALUES (
    auth.uid(), 'order_debit', -v_charge, v_balance_after,
    'order', v_order.id, 'Order ' || substr(v_order.id::text, 1, 8)
  );

  RETURN v_order;
END;
$$;

-- 3.2 Admin sets an absolute balance; the delta is recorded in the ledger.
CREATE OR REPLACE FUNCTION public.admin_set_balance(
  p_user_id UUID,
  p_new_balance NUMERIC,
  p_reason TEXT DEFAULT 'Manual admin adjustment'
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
  v_delta NUMERIC(12, 2);
BEGIN
  -- is_admin() returns NULL (not FALSE) for a missing uid, so test explicitly.
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only' USING ERRCODE = '42501';
  END IF;
  IF p_new_balance IS NULL OR p_new_balance < 0 THEN
    RAISE EXCEPTION 'Balance must be zero or positive';
  END IF;

  SELECT * INTO v_profile
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_delta := round(p_new_balance - v_profile.balance, 2);
  IF v_delta = 0 THEN
    RETURN v_profile;
  END IF;

  UPDATE public.user_profiles
     SET balance = round(p_new_balance, 2),
         updated_at = now()
   WHERE id = p_user_id
  RETURNING * INTO v_profile;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  )
  VALUES (
    p_user_id, 'admin_adjustment', v_delta, v_profile.balance,
    'manual', NULL, COALESCE(p_reason, 'Manual admin adjustment')
  );

  RETURN v_profile;
END;
$$;

-- 3.3 Refund a canceled/failed order back to the wallet (idempotent).
CREATE OR REPLACE FUNCTION public.refund_order(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Order refund'
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_balance_after NUMERIC(12, 2);
BEGIN
  -- is_admin() returns NULL (not FALSE) for a missing uid, so test explicitly.
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.status NOT IN ('canceled', 'failed') THEN
    RAISE EXCEPTION 'Only canceled or failed orders can be refunded';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.balance_transactions
    WHERE reference_type = 'order'
      AND reference_id = p_order_id
      AND type = 'refund'
  ) THEN
    RAISE EXCEPTION 'Order has already been refunded';
  END IF;

  UPDATE public.user_profiles
     SET balance = balance + v_order.charge,
         total_spent = GREATEST(total_spent - v_order.charge, 0),
         updated_at = now()
   WHERE id = v_order.user_id
  RETURNING balance INTO v_balance_after;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  )
  VALUES (
    v_order.user_id, 'refund', v_order.charge, v_balance_after,
    'order', v_order.id, COALESCE(p_reason, 'Order refund')
  );

  RETURN v_order;
END;
$$;

-- 3.4 Mark a payment completed and credit the wallet. Idempotent so webhook
--     retries can never double-credit. Restricted to the service role.
CREATE OR REPLACE FUNCTION public.credit_deposit(
  p_payment_id UUID
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_balance_after NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  -- Already credited: make webhook retries safe no-ops.
  IF v_payment.status = 'completed' THEN
    RETURN v_payment;
  END IF;

  UPDATE public.payments
     SET status = 'completed',
         updated_at = now()
   WHERE id = p_payment_id
  RETURNING * INTO v_payment;

  UPDATE public.user_profiles
     SET balance = balance + v_payment.amount,
         updated_at = now()
   WHERE id = v_payment.user_id
  RETURNING balance INTO v_balance_after;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  )
  VALUES (
    v_payment.user_id, 'deposit', v_payment.amount, v_balance_after,
    'payment', v_payment.id,
    'Deposit via ' || COALESCE(v_payment.payment_method, 'gateway')
  );

  RETURN v_payment;
END;
$$;

-- 4. Function grants ---------------------------------------------------------
-- Supabase issues default EXECUTE grants to anon/authenticated, so revoke from
-- each role explicitly (PUBLIC alone is not enough), then grant the minimum.
REVOKE EXECUTE ON FUNCTION public.place_order(UUID, TEXT, INTEGER, INTEGER, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, TEXT, INTEGER, INTEGER, UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_set_balance(UUID, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_balance(UUID, NUMERIC, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.refund_order(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_order(UUID, TEXT) TO authenticated;

-- Deposit crediting is a server-only webhook operation.
REVOKE EXECUTE ON FUNCTION public.credit_deposit(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_deposit(UUID) TO service_role;

-- 5. Backfill ledger for historical rows (idempotent) ------------------------
INSERT INTO public.balance_transactions (
  user_id, type, amount, balance_after, reference_type, reference_id, description, created_at
)
SELECT p.user_id, 'deposit', p.amount, p.amount,
       'payment', p.id, 'Backfilled historical deposit', p.created_at
FROM public.payments p
WHERE p.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM public.balance_transactions bt
    WHERE bt.reference_type = 'payment' AND bt.reference_id = p.id
  );

INSERT INTO public.balance_transactions (
  user_id, type, amount, balance_after, reference_type, reference_id, description, created_at
)
SELECT o.user_id, 'order_debit', -o.charge, 0,
       'order', o.id, 'Backfilled historical order', o.created_at
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1 FROM public.balance_transactions bt
  WHERE bt.reference_type = 'order' AND bt.reference_id = o.id
);
