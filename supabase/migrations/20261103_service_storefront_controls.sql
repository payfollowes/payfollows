-- Add customer storefront controls to provider-imported and manually managed services.
-- Existing rows remain visible by default and retain all service/order history.
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS is_visible_to_users BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.services.is_visible_to_users IS
  'Whether this service is listed in customer-facing catalogs; independent of service operational status.';
COMMENT ON COLUMN public.services.display_order IS
  'Customer catalog sort rank; lower values appear first.';

CREATE INDEX IF NOT EXISTS idx_services_storefront_order
  ON public.services (display_order, category, name)
  WHERE status = 'active' AND rate_per_1000 > 0 AND is_visible_to_users = TRUE;

-- Enforce storefront visibility at the database boundary as well as the public API.
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (
    status = 'active'
    AND rate_per_1000 > 0
    AND is_visible_to_users = TRUE
  );
