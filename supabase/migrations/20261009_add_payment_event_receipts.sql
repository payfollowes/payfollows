-- Description: Add a durable ledger for payment webhook idempotency and replay protection.
-- This is an additive migration designed to make duplicate payment callbacks harmless before
-- a balance credit is applied. It does not rewrite historical payment rows or balances.

CREATE TABLE IF NOT EXISTS public.payment_event_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT,
  event_status TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_id, provider_name, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_event_receipts_payment_id
  ON public.payment_event_receipts (payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_event_receipts_provider_event
  ON public.payment_event_receipts (provider_name, provider_event_id);

ALTER TABLE public.payment_event_receipts
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_event_receipts_admin_write
  ON public.payment_event_receipts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY payment_event_receipts_admin_read
  ON public.payment_event_receipts
  FOR SELECT
  USING (true);
