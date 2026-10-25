import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSupabase = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));

const mockSupabaseAdmin = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));

const mockConfig = vi.hoisted(() => ({
  supabaseConfigured: true,
  supabaseAdminConfigured: true,
}));

vi.mock('../lib/supabaseServer.js', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin,
  get supabaseConfigured() {
    return mockConfig.supabaseConfigured;
  },
  get supabaseAdminConfigured() {
    return mockConfig.supabaseAdminConfigured;
  },
}));

import adminRouter from './admin.js';

const dispatch = (router, req) =>
  new Promise((resolve) => {
    const response = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
        return this;
      },
      send(payload) {
        resolve({ statusCode: this.statusCode, payload });
        return this;
      },
    };
    router.handle(req, response, () => resolve({ statusCode: 500, payload: { error: 'next called' } }));
  });

const profileChain = (profile) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
});

describe('admin router authorization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CRON_SECRET;
    mockConfig.supabaseConfigured = true;
    mockConfig.supabaseAdminConfigured = true;
    mockSupabase.auth.getUser.mockReset();
    mockSupabaseAdmin.auth.getUser.mockReset();
    mockSupabase.from.mockReset();
    mockSupabaseAdmin.from.mockReset();
  });

  it('rejects unauthenticated requests to admin endpoints with 401', async () => {
    const result = await dispatch(adminRouter, {
      method: 'GET',
      url: '/margin-rules',
      path: '/margin-rules',
      headers: {},
      query: {},
    });

    expect(result.statusCode).toBe(401);
    expect(result.payload.error.code).toBe('MISSING_TOKEN');
  });

  it('rejects authenticated non-admin users with 403', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });
    mockSupabaseAdmin.from.mockReturnValue(
      profileChain({ id: 'user-1', role: 'user', status: 'active' })
    );

    const result = await dispatch(adminRouter, {
      method: 'GET',
      url: '/margin-rules',
      path: '/margin-rules',
      headers: { authorization: 'Bearer user-token' },
      query: {},
    });

    expect(result.statusCode).toBe(403);
  });

  it('allows active admins through the guard', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      error: null,
    });
    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return profileChain({ id: 'admin-1', role: 'admin', status: 'active' });
      }
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: [], error: null }),
      };
    });

    const result = await dispatch(adminRouter, {
      method: 'GET',
      url: '/margin-rules',
      path: '/margin-rules',
      headers: { authorization: 'Bearer admin-token' },
      query: {},
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload.success).toBe(true);
  });

  it('lets the cron route skip the session guard and fail on a missing secret', async () => {
    // No Authorization header at all: a session guard would answer 401, while
    // the cron bypass must reach requireCronSecret (503 when unset).
    const result = await dispatch(adminRouter, {
      method: 'POST',
      url: '/cron/sync-providers',
      path: '/cron/sync-providers',
      headers: {},
      body: {},
    });

    expect(result.statusCode).toBe(503);
    expect(result.payload.error.code).toBe('CRON_NOT_CONFIGURED');
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });
});
