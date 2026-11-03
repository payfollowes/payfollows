-- ============================================================================
-- Provider catalog import RPC
-- 2026-10-25
--
-- Bootstrap/operational helper that imports a provider SMM catalog previously
-- fetched through pg_net (see net._http_response) into the customer-facing
-- services table and the provider_services mapping table.
--
-- Mirrors the legacy Express syncProviderCore conventions:
--   * service names are prefixed with the provider service id
--   * our_rate = provider_rate * (1 + markup/100), rounded to 2 decimals
--   * zero-priced rows are kept but hidden (inactive)
--   * replace mode deactivates catalog rows the provider no longer offers
--
-- Service-role only: it is an administrative import, never client-facing.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.import_provider_catalog(
  p_provider_id UUID,
  p_http_response_id BIGINT,
  p_markup_percent NUMERIC DEFAULT 20,
  p_replace_existing BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
DECLARE
  v_provider public.providers%ROWTYPE;
  v_content JSONB;
  v_total INT;
  v_chunk CONSTANT INT := 250;
  v_i INT;
  v_count INT;
  v_services_upserted INT := 0;
  v_mappings_upserted INT := 0;
  v_deactivated INT := 0;
  v_row_count INT := 0;
  v_previously_owned UUID[];
BEGIN
  SELECT * INTO v_provider FROM public.providers WHERE id = p_provider_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider not found';
  END IF;

  SELECT content::jsonb INTO v_content
  FROM net._http_response
  WHERE id = p_http_response_id AND status_code BETWEEN 200 AND 299;

  IF v_content IS NULL OR jsonb_typeof(v_content) <> 'array' THEN
    RAISE EXCEPTION 'HTTP response % is not a JSON array', p_http_response_id;
  END IF;

  v_total := jsonb_array_length(v_content);

  -- Normalize and dedupe the provider catalog (temp table, session scoped).
  CREATE TEMP TABLE tmp_catalog_import ON COMMIT DROP AS
  SELECT DISTINCT ON (provider_service_id)
    provider_service_id,
    service_name,
    category,
    description,
    provider_rate,
    our_rate,
    min_quantity,
    max_quantity,
    CASE WHEN provider_rate > 0 THEN 'active' ELSE 'inactive' END AS status
  FROM (
    SELECT
      COALESCE(NULLIF(elem->>'service', ''), 'unknown_' || rn) AS provider_service_id,
      LEFT(
        COALESCE(NULLIF(elem->>'service', ''), 'unknown_' || rn) || ' - ' || COALESCE(elem->>'name', ''),
        180
      ) AS service_name,
      LEFT(COALESCE(NULLIF(elem->>'category', ''), 'Other'), 80) AS category,
      LEFT(COALESCE(elem->>'description', ''), 8000) AS description,
      ROUND(GREATEST(LEAST(COALESCE(NULLIF(elem->>'rate', '')::numeric, 0), 999999999999.999999), 0), 6) AS provider_rate,
      ROUND(
        GREATEST(LEAST(COALESCE(NULLIF(elem->>'rate', '')::numeric, 0), 999999999999.999999), 0)
          * (1 + GREATEST(p_markup_percent, 0) / 100.0),
        6
      ) AS our_rate,
      GREATEST(LEAST(COALESCE(NULLIF(elem->>'min', '')::bigint, 1), 2147483647), 1) AS min_quantity,
      LEAST(
        GREATEST(COALESCE(NULLIF(elem->>'max', '')::bigint, 10000), GREATEST(LEAST(COALESCE(NULLIF(elem->>'min', '')::bigint, 1), 2147483647), 1)),
        2147483647
      ) AS max_quantity,
      rn
    FROM (
      SELECT je.elem, row_number() OVER () AS rn
      FROM jsonb_array_elements(v_content) AS je(elem)
    ) raw
  ) norm
  ORDER BY provider_service_id, rn;

  -- Dedupe service names as well (defensive; prefixed ids are normally unique).
  CREATE TEMP TABLE tmp_catalog_dedup ON COMMIT DROP AS
  SELECT DISTINCT ON (service_name) *
  FROM tmp_catalog_import
  ORDER BY service_name, provider_service_id;

  SELECT count(*) INTO v_count FROM tmp_catalog_dedup;

  -- 1. Upsert customer-facing services in chunks.
  v_i := 0;
  WHILE v_i < v_count LOOP
    INSERT INTO public.services (name, category, description, rate_per_1000, min_quantity, max_quantity, status)
    SELECT service_name, category, NULLIF(description, ''), our_rate, min_quantity, max_quantity, status
    FROM tmp_catalog_dedup
    ORDER BY provider_service_id
    LIMIT v_chunk OFFSET v_i
    ON CONFLICT (name) DO UPDATE SET
      category = EXCLUDED.category,
      description = COALESCE(EXCLUDED.description, public.services.description),
      rate_per_1000 = EXCLUDED.rate_per_1000,
      min_quantity = EXCLUDED.min_quantity,
      max_quantity = EXCLUDED.max_quantity,
      status = EXCLUDED.status,
      updated_at = now();

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_services_upserted := v_services_upserted + v_row_count;
    v_i := v_i + v_chunk;
  END LOOP;

  -- 2. Upsert provider mappings in chunks, resolving service ids by unique name.
  v_i := 0;
  WHILE v_i < v_count LOOP
    INSERT INTO public.provider_services (
      provider_id, service_id, provider_service_id, provider_rate, our_rate,
      min_quantity, max_quantity, status
    )
    SELECT
      p_provider_id,
      s.id,
      d.provider_service_id,
      d.provider_rate,
      d.our_rate,
      d.min_quantity,
      d.max_quantity,
      d.status
    FROM (
      SELECT * FROM tmp_catalog_dedup
      ORDER BY provider_service_id
      LIMIT v_chunk OFFSET v_i
    ) d
    JOIN public.services s ON s.name = d.service_name
    ON CONFLICT (provider_id, provider_service_id) DO UPDATE SET
      service_id = EXCLUDED.service_id,
      provider_rate = EXCLUDED.provider_rate,
      our_rate = EXCLUDED.our_rate,
      min_quantity = EXCLUDED.min_quantity,
      max_quantity = EXCLUDED.max_quantity,
      status = EXCLUDED.status,
      updated_at = now();

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_mappings_upserted := v_mappings_upserted + v_row_count;
    v_i := v_i + v_chunk;
  END LOOP;

  -- 3. Replace mode: deactivate services this provider used to own but the
  --    fresh catalog no longer maps.
  IF p_replace_existing THEN
    SELECT COALESCE(array_agg(DISTINCT service_id), '{}')
    INTO v_previously_owned
    FROM public.provider_services
    WHERE provider_id = p_provider_id AND service_id IS NOT NULL;

    IF array_length(v_previously_owned, 1) IS NOT NULL THEN
      WITH still_mapped AS (
        SELECT DISTINCT service_id
        FROM public.provider_services
        WHERE provider_id = p_provider_id
      )
      UPDATE public.services svc
      SET status = 'inactive', updated_at = now()
      WHERE svc.id = ANY(v_previously_owned)
        AND svc.id NOT IN (SELECT service_id FROM still_mapped);
      GET DIAGNOSTICS v_deactivated = ROW_COUNT;
    END IF;
  END IF;

  UPDATE public.providers SET last_sync = now() WHERE id = p_provider_id;

  RETURN jsonb_build_object(
    'catalog_rows', v_total,
    'deduped_rows', v_count,
    'services_touched', v_services_upserted,
    'mappings_touched', v_mappings_upserted,
    'deactivated_stale', v_deactivated
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.import_provider_catalog(UUID, BIGINT, NUMERIC, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_provider_catalog(UUID, BIGINT, NUMERIC, BOOLEAN) TO service_role;
