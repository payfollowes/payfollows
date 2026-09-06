import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSupabase = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('../lib/supabaseServer.js', () => ({
  supabase: mockSupabase,
  supabaseAdmin: {},
  supabaseConfigured: true,
  supabaseAdminConfigured: false,
}));

import { globalCache } from '../lib/cache.js';
import publicServicesRouter from './publicServices.js';

describe('public services catalog caching', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves the catalog with revalidate cache headers so browsers/CDN never hold pre-write snapshots', async () => {
    // Warm the cache so the route takes the fast path (no DB call needed).
    globalCache.set('public:services', [{ id: 's1', name: 'catalog' }]);

    const set = vi.fn().mockReturnThis();
    const json = vi.fn();
    const req = { url: '/', method: 'GET', query: {}, headers: {}, params: {} };
    const res = { set, json };

    publicServicesRouter.handle(req, res, () => {});

    await vi.waitFor(() => {
      expect(json).toHaveBeenCalled();
    });

    // max-age=0 + must-revalidate: every request revalidates against the server,
    // so an admin edit (price, completion time) reaches customers immediately
    // while the in-memory globalCache still shields the database.
    expect(set).toHaveBeenCalledWith('Cache-Control', 'max-age=0, must-revalidate');
  });
});