import express from 'express';
import { supabase, supabaseConfigured } from '../lib/supabaseServer.js';
import { globalCache } from '../lib/cache.js';

const router = express.Router();
const PAGE_SIZE = 1000;
const MAX_ROWS = 50000;

export function filterAndSortPublicServices(services) {
  return services
    .filter((service) => service.is_visible_to_users !== false && Number(service.rate_per_1000) > 0)
    .sort((a, b) => {
      const orderDifference = Number(a.display_order ?? 0) - Number(b.display_order ?? 0);
      if (orderDifference !== 0) return orderDifference;
      const categoryDifference = String(a.category || '').localeCompare(String(b.category || ''));
      return categoryDifference || String(a.name || '').localeCompare(String(b.name || ''));
    });
}

/**
 * Fetch active, priced services marked visible for public consumption
 */
async function fetchPublicServicesFromDB() {
  if (!supabaseConfigured || !supabase) {
    return [];
  }

  const allServices = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('[Public Services] Supabase fetch error:', error);
      throw error;
    }

    const page = Array.isArray(data) ? data : [];
    allServices.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  // Visibility and ordering are also applied in application code so the catalog
  // remains safe and deterministic while an additive database migration rolls out.
  return filterAndSortPublicServices(allServices);
}

/**
 * GET /api/services
 *
 * Public endpoint to fetch available services
 * Only returns active services with 10-minute cache TTL
 *
 * Features:
 * - Server-side in-memory caching (10 minutes)
 * - Request deduplication (if multiple requests arrive during fetch)
 * - HTTP cache headers for client-side caching
 * - Fast response times on cache hits
 *
 * Response:
 * ```
 * {
 *   "services": [
 *     {
 *       "id": "uuid",
 *       "name": "Instagram Followers",
 *       "category": "instagram",
 *       "rate_per_1000": 2.50,
 *       "min_quantity": 100,
 *       "max_quantity": 10000,
 *       "status": "active",
 *       ...
 *     }
 *   ]
 * }
 * ```
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    // Use cache with timeout handling
    // If database is slow, will return stale cache if available
    const services = await globalCache.get('public:services', fetchPublicServicesFromDB);

    const age = Date.now() - startTime;

    // Force revalidation so a browser/CDN never serves a pre-write snapshot:
    // admin edits (prices, completion times) must reach customers immediately.
    // The in-memory globalCache still shields the DB, and Express ETags turn
    // unchanged responses into cheap 304s.
    res.set('Cache-Control', 'max-age=0, must-revalidate'); // revalidate every request
    res.set('X-Cache-Source', 'server');
    res.set('X-Response-Time-Ms', String(age));

    console.log(`[Services] GET /api/services - ${services.length} services - ${age}ms`);

    return res.json({
      services,
      cached: true,
      age: Math.floor(age / 1000),
    });
  } catch (err) {
    const age = Date.now() - startTime;
    console.error('[Services] Error fetching services:', {
      error: err.message,
      duration: age,
    });

    // Return graceful fallback
    res.set('Cache-Control', 'public, max-age=60'); // 1 minute fallback cache
    res.set('X-Cache-Source', 'fallback');
    
    return res.json({
      services: [],
      cached: false,
      error: 'Service temporarily unavailable',
    });
  }
});

// GET /api/services/:id
// Fetch a single active service by id
router.get('/:id', async (req, res) => {
  try {
    if (!supabaseConfigured || !supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const serviceId = String(req.params.id || '').trim();
    if (!serviceId) {
      return res.status(400).json({ error: 'Missing service id' });
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('[Public Services] Service detail error:', error);
      return res.status(500).json({ error: error.message || 'Failed to load service' });
    }

    if (!data || data.is_visible_to_users === false || Number(data.rate_per_1000) <= 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.json({ service: data });
  } catch (err) {
    console.error('[Public Services] Service detail error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
