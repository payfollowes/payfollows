import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSupabase = vi.hoisted(() => ({ from: vi.fn() }));
const mockSupabaseAdmin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('../lib/supabaseServer.js', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin,
  supabaseConfigured: true,
  supabaseAdminConfigured: true,
}));

import { adminCache, globalCache } from '../lib/cache.js';
import servicesRouter from './services.js';
import integrationsRouter from './integrations.js';

// Factories for each provider-services DB query, consumed in order.
let providerServicesQueryQueue = [];

function dispatchServicePatch() {
  return new Promise((resolve) => {
    const req = {
      url: '/s1',
      method: 'PATCH',
      body: { name: 'updated' },
      params: { id: 's1' },
      query: {},
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((body) => {
        resolve(body);
        return res;
      }),
      send: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    servicesRouter.handle(req, res, () => {});
  });
}

function dispatchProviderServices() {
  return new Promise((resolve) => {
    const req = {
      url: '/provider-services',
      method: 'GET',
      query: {},
      headers: {},
      body: {},
      params: {},
      validatedQuery: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((body) => {
        resolve(body);
        return res;
      }),
      send: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    integrationsRouter.handle(req, res, () => {});
  });
}

describe('admin service write invalidation', () => {
  beforeEach(() => {
    providerServicesQueryQueue = [];
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockSupabase.from.mockImplementation((table) => {
      if (table !== 'services') throw new Error(`unexpected table: ${table}`);
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ id: 's1', name: 'updated' }], error: null }),
      };
    });

    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table !== 'provider_services') throw new Error(`unexpected admin table: ${table}`);
      return {
        select: vi.fn((cols) => {
          if (String(cols).trim() === 'completion_time_text, completion_time_override') {
            // completion-time column probe (its exact select string)
            return { limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
          }
          return {
            range: vi.fn(() => ({
              abortSignal: vi.fn(() => {
                const next = providerServicesQueryQueue.shift();
                if (!next) throw new Error('No queued provider-services query result');
                // supabase clients resolve { data, error } from .abortSignal()
                return next().then((rows) => ({ data: rows, error: null }));
              }),
            })),
          };
        }),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invalidates the admin and public service caches when a service is updated', async () => {
    // Warm both list caches with pre-write snapshots.
    adminCache.set('admin:services', [{ id: 's1', name: 'old' }]);
    globalCache.set('public:services', [{ id: 's1', name: 'old' }]);

    await dispatchServicePatch();

    // Each cache must refetch rather than serve the pre-write snapshot.
    const adminFetcher = vi.fn().mockResolvedValue([{ id: 's1', name: 'new-admin' }]);
    expect(await adminCache.get('admin:services', adminFetcher)).toEqual([{ id: 's1', name: 'new-admin' }]);
    expect(adminFetcher).toHaveBeenCalledTimes(1);

    const publicFetcher = vi.fn().mockResolvedValue([{ id: 's1', name: 'new-public' }]);
    expect(await globalCache.get('public:services', publicFetcher)).toEqual([{ id: 's1', name: 'new-public' }]);
    expect(publicFetcher).toHaveBeenCalledTimes(1);
  });

  it('invalidates the provider-services snapshot too when a service is updated', async () => {
    // Warm the provider-services snapshot through its real route.
    providerServicesQueryQueue = [() => Promise.resolve([{ id: 'm1', service_id: 's1' }])];
    const warm = await dispatchProviderServices();
    expect(warm.data.providerServices).toEqual([{ id: 'm1', service_id: 's1' }]);

    // The DB now has different mappings; a GET after the PATCH must re-query,
    // not reuse the pre-write snapshot.
    providerServicesQueryQueue = [() => Promise.resolve([{ id: 'm2', service_id: 's1' }])];
    await dispatchServicePatch();

    const after = await dispatchProviderServices();
    expect(after.data.providerServices).toEqual([{ id: 'm2', service_id: 's1' }]);
    expect(providerServicesQueryQueue.length).toBe(0); // both queries consumed, none skipped via stale cache
  });
});