import express from 'express';
import { supabaseAdmin, supabaseAdminConfigured } from '../lib/supabaseServer.js';
import { validateRequest, validateQuery, schemas } from '../lib/validation.js';
import { successResponse, errorResponse, asyncHandler } from '../lib/apiResponse.js';
import CacheStore, { globalCache, adminCache } from '../lib/cache.js';

const router = express.Router();
const SUPABASE_QUERY_TIMEOUT_MS = 12000;
const PROVIDER_SERVICES_CACHE_TTL_MS = 60000;
const PAGED_QUERY_SIZE = 1000;
const PAGED_QUERY_MAX_ROWS = 50000;

// Generation-guarded in-memory cache (60s TTL) for the provider-services snapshot.
// Uses CacheStore so invalidations bump a generation counter: an in-flight query
// that started before a write can no longer repopulate the cache with a stale
// snapshot afterwards (see server/lib/cache.test.js for the race regression test).
const providerServicesCache = new CacheStore(PROVIDER_SERVICES_CACHE_TTL_MS, SUPABASE_QUERY_TIMEOUT_MS);

export function invalidateProviderServicesCache() {
  providerServicesCache.invalidate('provider-services');
}

/**
 * Invalidate every cached view of the service catalog after any write that
 * changes services, provider mappings, or rates. Single choke point so no
 * write path can leave one of the caches stale.
 */
export function invalidateServiceCaches() {
  invalidateProviderServicesCache();
  globalCache.invalidate('public:services');
  adminCache.invalidate('admin:services');
}

const getApiKeyFromRequest = (req) => {
  const directKey = req.headers['x-api-key'];
  if (directKey) {
    return String(directKey).trim();
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader) {
    const [scheme, value] = String(authHeader).split(' ');
    if (/^Bearer$/i.test(scheme) && value) {
      return value.trim();
    }
  }

  return '';
};

async function runTimedQuery(query, label) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_QUERY_TIMEOUT_MS);

  try {
    return await query.abortSignal(controller.signal);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[Server] ${label} timed out after ${SUPABASE_QUERY_TIMEOUT_MS}ms`);
      return {
        data: null,
        error: new Error(`${label} timed out`),
      };
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchAllRows(buildQuery, label) {
  const rows = [];

  for (let offset = 0; offset < PAGED_QUERY_MAX_ROWS; offset += PAGED_QUERY_SIZE) {
    const from = offset;
    const to = offset + PAGED_QUERY_SIZE - 1;

    const { data, error } = await runTimedQuery(buildQuery(from, to), `${label} (page ${offset / PAGED_QUERY_SIZE + 1})`);
    if (error) {
      return { data: rows, error };
    }

    const page = Array.isArray(data) ? data : [];
    rows.push(...page);

    if (page.length < PAGED_QUERY_SIZE) {
      break;
    }
  }

  return { data: rows, error: null };
}

// GET /api/integrations/provider-names
// Fetches provider names using admin access (bypasses RLS)
router.get(
  '/provider-names',
  asyncHandler(async (req, res) => {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return res.status(503).json(errorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable'));
    }

    const { data: providers, error } = await supabaseAdmin
      .from('providers')
      .select('id, name');

    if (error) {
      console.error('[Server] Error fetching provider names:', error);
      return res.status(500).json(errorResponse('FETCH_PROVIDERS_FAILED', 'Failed to fetch providers'));
    }

    // Build a map for easy client-side lookup
    const providerMap = {};
    if (providers) {
      providers.forEach(p => {
        providerMap[p.id] = p.name || 'Unknown Provider';
      });
    }

    console.log('[Server] Provider names fetched:', Object.keys(providerMap).length, 'providers');
    return res.json(successResponse({ providers: providerMap }));
  })
);

// GET /api/integrations/service-names
// Fetches all service names using admin access (bypasses RLS)
router.get(
  '/service-names',
  asyncHandler(async (req, res) => {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return res.status(503).json(errorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable'));
    }

    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('id, name, category, description');

    if (error) {
      console.error('[Server] Error fetching service names:', error);
      return res.status(500).json(errorResponse('FETCH_SERVICES_FAILED', 'Failed to fetch services'));
    }

    // Build a map for easy client-side lookup
    const serviceMap = {};
    if (services) {
      services.forEach(s => {
        serviceMap[s.id] = {
          name: s.name || 'Unknown Service',
          category: s.category || 'General',
          description: s.description || ''
        };
      });
    }

    console.log('[Server] Service names fetched:', Object.keys(serviceMap).length, 'services');
    return res.json(successResponse({ services: serviceMap }));
  })
);

// GET /api/integrations/provider-service-link
// Resolves a single service to its provider mapping during order submit.
router.get(
  '/provider-service-link',
  validateQuery(schemas.providerServiceLinkQuery),
  asyncHandler(async (req, res) => {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return res.status(503).json(errorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable'));
    }

    const serviceId = req.validatedQuery.service_id;

    // Canonical linkage: a single active provider_services row owns the service_id.
    const { data: directLink, error: directLinkError } = await runTimedQuery(
      supabaseAdmin
        .from('provider_services')
        .select('provider_id, provider_service_id, service_id, status')
        .eq('service_id', serviceId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
      'direct provider service link query'
    );

    if (directLinkError) {
      console.error('[Server] Error fetching direct provider link:', directLinkError);
      return res.status(500).json(errorResponse('DIRECT_LINK_FAILED', 'Failed to resolve provider link'));
    }

    if (directLink?.provider_id && directLink?.provider_service_id) {
      return res.json(successResponse({ providerLink: directLink }));
    }

    return res.json(successResponse({ providerLink: null }));
  })
);

// The provider completion-time fields (completion_time_text, completion_time_override,
// completion_time_override_hours) arrive with migration
// 20260906_add_provider_completion_time_fields.sql; probe so the snapshot keeps
// working (hours-only) until it has been applied.
let providerServicesTimeTextProbe = { at: 0, available: false };
const providerServicesHasTimeTextColumn = async () => {
  if (Date.now() - providerServicesTimeTextProbe.at < 5 * 60 * 1000) {
    return providerServicesTimeTextProbe.available;
  }
  let available = false;
  try {
    const { error } = await supabaseAdmin
      .from('provider_services')
      .select('completion_time_text, completion_time_override')
      .limit(1);
    available = !error;
  } catch (error) {
    console.warn('[provider-services] completion-time fields probe failed:', error?.message || error);
    available = false;
  }
  providerServicesTimeTextProbe = { at: Date.now(), available };
  return available;
};

// GET /api/integrations/provider-services
// Fetches provider services with joined service info (so category is available)
router.get(
  '/provider-services',
  asyncHandler(async (req, res) => {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return res.status(503).json(errorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable'));
    }

    const hasTimeTextColumn = await providerServicesHasTimeTextColumn();

    const fetchProviderServices = async () => {
      const { data: providerServices, error } = await fetchAllRows(
        (from, to) =>
          supabaseAdmin
            .from('provider_services')
            .select(`
              id,
              provider_id,
              provider_service_id,
              provider_rate,
              our_rate,
              min_quantity,
              max_quantity,
              status,
              service_id,
              ${hasTimeTextColumn
                ? 'completion_time_text, completion_time_override, completion_time_override_hours,'
                : ''}
              services (
                id,
                name,
                category,
                description,
                completion_time,
                status
              )
            `)
            .range(from, to),
        'provider services query'
      );

      if (error) {
        console.error('[Server] Error fetching provider services:', error);
        throw new Error(error.message || 'Failed to fetch provider services');
      }

      console.log('[Server] Provider services fetched:', providerServices.length, 'rows');
      return providerServices || [];
    };

    try {
      const providerServices = await providerServicesCache.get('provider-services', fetchProviderServices);
      return res.json(successResponse({ providerServices }));
    } catch (error) {
      // Cold-cache DB failure: degrade to an empty list without caching (previous behavior).
      console.error('[Server] Provider services fetch failed:', error);
      return res.json(successResponse({ providerServices: [] }));
    }
  })
);

// POST /api/integrations
// Basic example: accept requests with header 'x-api-key' representing a per-user API key
// and return basic user info or allow order creation in a production implementation.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const apiKey = getApiKeyFromRequest(req);
    if (!apiKey) return res.status(401).json(errorResponse('MISSING_API_KEY', 'Missing API key'));

    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return res.status(503).json(errorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable (Supabase not configured on server)'));
    }

    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, role, balance')
      .eq('api_key', apiKey)
      .limit(1);

    if (error) {
      console.error('Supabase error looking up api key', error);
      return res.status(500).json(errorResponse('INTEGRATION_ERROR', 'Internal server error'));
    }

    const user = (users && users[0]) || null;
    if (!user) return res.status(401).json(errorResponse('INVALID_API_KEY', 'Invalid API key'));

    // For now return a small integration contract. In production, you'd implement
    // create order, check balance, charge, and return order status.
    return res.json(successResponse({
      user: { id: user.id, username: user.username, role: user.role, balance: user.balance },
      note: 'This endpoint verifies API key. Implement order creation and other actions as needed.'
    }));
  })
);

export default router;
