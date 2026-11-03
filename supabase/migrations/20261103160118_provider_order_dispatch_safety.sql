-- Keep provider dispatch tied to the authenticated, already-charged local order.
-- The claim column prevents a client retry from submitting one order twice.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS provider_submission_started_at TIMESTAMPTZ;

-- A definitive provider rejection must fail the local order and restore its
-- wallet debit atomically. Repeated calls are idempotent through the ledger.
CREATE OR REPLACE FUNCTION public.fail_order_and_refund(
  p_order_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_balance NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status IN ('completed', 'canceled') THEN
    RETURN v_order;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.balance_transactions
    WHERE reference_type = 'order'
      AND reference_id = v_order.id
      AND type = 'refund'
  ) THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders
  SET status = 'failed', updated_at = now()
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  UPDATE public.user_profiles
  SET balance = balance + v_order.charge,
      total_spent = GREATEST(0, total_spent - v_order.charge),
      updated_at = now()
  WHERE id = v_order.user_id
  RETURNING balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order owner profile not found';
  END IF;

  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_after, reference_type, reference_id, description
  )
  VALUES (
    v_order.user_id,
    'refund',
    v_order.charge,
    v_balance,
    'order',
    v_order.id,
    'Provider rejected order ' || substr(v_order.id::text, 1, 8)
      || CASE WHEN NULLIF(trim(p_reason), '') IS NULL THEN ''
              ELSE ': ' || left(trim(p_reason), 350) END
  );

  RETURN v_order;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fail_order_and_refund(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_order_and_refund(UUID, TEXT)
  TO service_role;
