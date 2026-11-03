-- Manual deposit approval/rejection must atomically update payment status,
-- customer balance, and the wallet ledger. Only the server service role may run it.
CREATE OR REPLACE FUNCTION public.review_manual_deposit(
  p_payment_id UUID,
  p_admin_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_balance_after NUMERIC(12, 2);
  v_details JSONB;
BEGIN
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid manual deposit action';
  END IF;

  SELECT * INTO v_payment
    FROM public.payments
   WHERE id = p_payment_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  IF v_payment.payment_provider <> 'manual' THEN
    RAISE EXCEPTION 'Only manual deposits can be reviewed here';
  END IF;
  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending deposits can be reviewed';
  END IF;
  IF p_action = 'approve' AND NULLIF(BTRIM(v_payment.transaction_id), '') IS NULL THEN
    RAISE EXCEPTION 'A transaction reference is required before approval';
  END IF;

  UPDATE public.payments
     SET status = CASE WHEN p_action = 'approve' THEN 'completed' ELSE 'failed' END,
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'manual_review', jsonb_build_object(
             'action', p_action,
             'admin_id', p_admin_id,
             'reason', NULLIF(BTRIM(p_reason), ''),
             'reviewed_at', now()
           )
         ),
         updated_at = now()
   WHERE id = p_payment_id
   RETURNING * INTO v_payment;

  IF p_action = 'approve' THEN
    UPDATE public.user_profiles
       SET balance = balance + v_payment.amount,
           updated_at = now()
     WHERE id = v_payment.user_id
     RETURNING balance INTO v_balance_after;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Customer profile not found';
    END IF;

    INSERT INTO public.balance_transactions (
      user_id, type, amount, balance_after, reference_type, reference_id, description
    ) VALUES (
      v_payment.user_id, 'deposit', v_payment.amount, v_balance_after,
      'payment', v_payment.id, 'Manually verified deposit via ' || COALESCE(v_payment.payment_method, 'manual')
    );
  END IF;

  v_details := jsonb_build_object(
    'action', p_action,
    'reason', NULLIF(BTRIM(p_reason), ''),
    'amount', v_payment.amount
  );
  INSERT INTO public.payment_logs (payment_id, user_id, action, details)
  VALUES (
    v_payment.id,
    v_payment.user_id,
    CASE WHEN p_action = 'approve' THEN 'manual_deposit_approved' ELSE 'manual_deposit_rejected' END,
    v_details
  );

  RETURN v_payment;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_manual_deposit(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_manual_deposit(UUID, UUID, TEXT, TEXT) TO service_role;
