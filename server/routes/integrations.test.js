import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A promise whose resolution we control externally, so a test can hold the
 * provider-services DB query "in-flight" across an invalidation.
 */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockSupabaseAdmin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('../lib/supabaseServer.js', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  supabaseAdminConfigured: true,
  supabase: {},
  supabaseConfigured: true,
}));

// Factories for each provider-services DB query, consumed in order.
let queryQueue = [];

import integrationsRouter from './integrations.js';
import { invalidateProviderServicesCache } from './integrations.js';

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

describe('provider-services cache', () => {
  beforeEach(() => {
    queryQueue = [];
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table !== 'provider_services') throw new Error(`unexpected table: ${table}`);
      return {
        select: vi.fn((cols) => {
          if (String(cols).trim() === 'completion_time_text, completion_time_override') {
            // completion-time column probe (its exact select string)
            return { limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
          }
          return {
            range: vi.fn(() => ({
              abortSignal: vi.fn(() => {
                const next = queryQueue.shift();
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

  it('serves cached rows within the TTL instead of re-querying the database', async () => {
    invalidateProviderServicesCache(); // clean slate
    queryQueue = [() => Promise.resolve([{ id: 'm1', service_id: 's1' }])];

    const first = await dispatchProviderServices();
    expect(first.success).toBe(true);
    expect(first.data.providerServices).toEqual([{ id: 'm1', service_id: 's1' }]);

    // DB would now return different data; the cached snapshot must win.
    queryQueue = [() => Promise.resolve([{ id: 'CHANGED' }])];
    const second = await dispatchProviderServices();
    expect(second.data.providerServices).toEqual([{ id: 'm1', service_id: 's1' }]);
    expect(queryQueue.length).toBe(1); // second query was never consumed
  });

  it('does not repopulate the snapshot with stale rows when invalidated mid-fetch', async () => {
    invalidateProviderServicesCache(); // clean slate
    const slow = deferred();
    queryQueue = [() => slow.promise, () => Promise.resolve([{ id: 'fresh' }])];

    const firstPromise = dispatchProviderServices();
    await Promise.resolve(); // let the query start and hang in-flight

    invalidateProviderServicesCache(); // a write lands while the query is in-flight

    slow.resolve([{ id: 'stale' }]);
    const first = await firstPromise;
    expect(first.data.providerServices).toEqual([{ id: 'stale' }]); // caller still gets its result

    // The stale rows must NOT have been cached — this request re-queries.
    const second = await dispatchProviderServices();
    expect(second.data.providerServices).toEqual([{ id: 'fresh' }]);
    expect(queryQueue.length).toBe(0); // both queries consumed, nothing cached stale
  });

  it('degrades to an empty list on a cold-cache DB failure without caching it', async () => {
    invalidateProviderServicesCache(); // clean slate
    queryQueue = [() => Promise.reject(new Error('db down'))];

    const first = await dispatchProviderServices();
    expect(first.success).toBe(true);
    expect(first.data.providerServices).toEqual([]);

    // Nothing was cached: once the DB recovers, the next request re-queries.
    queryQueue = [() => Promise.resolve([{ id: 'm1' }])];
    const second = await dispatchProviderServices();
    expect(second.data.providerServices).toEqual([{ id: 'm1' }]);
  });
});