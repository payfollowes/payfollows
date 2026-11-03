-- Reseller API support: service-role order placement (key-authenticated
-- /api/v2/action) and self-service API key regeneration.

-- 1. Core order routine with an explicit user id. Mirrors place_order() but
--    trusts the caller to have authenticated the user (the reseller router
--    resolves the profile from the API key with the service role).
CREATE OR REPLACE FUNCTION public.place_order_for_user(
  p_user_id UUID,
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
    p_user_id, p_service_id, p_provider_id, p_provider_order_id,
    trim(p_link), p_quantity, v_charge, COALESCE(p_delivery_time, 24), 'pending'
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

-- 2. Keep the session-based RPC as a thin wrapper over the core routine so
--    the existing web contract and its grants stay identical.
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
    p_provider_order_id
  );
END;
$$;

-- 3. Self-service API key rotation for the reseller API. SECURITY DEFINER so
--    the sensitive-field guard trigger (which blocks direct client writes of
--    api_key) does not reject the change.
CREATE OR REPLACE FUNCTION public.regenerate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_key TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_key := public.generate_api_key();

  UPDATE public.user_profiles
     SET api_key = v_key,
         updated_at = now()
   WHERE id = v_user_id;

  RETURN v_key;
END;
$$;

-- 4. Grants ------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.place_order_for_user(UUID, UUID, TEXT, INTEGER, INTEGER, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_for_user(UUID, UUID, TEXT, INTEGER, INTEGER, UUID, TEXT)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.place_order(UUID, TEXT, INTEGER, INTEGER, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, TEXT, INTEGER, INTEGER, UUID, TEXT)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.regenerate_api_key() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.regenerate_api_key() TO authenticated;
