import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSupabaseAdmin = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

const mockConfig = vi.hoisted(() => ({ supabaseAdminConfigured: true }));

const mockSmm = vi.hoisted(() => ({
  callSmmProvider: vi.fn(),
  extractProviderError: vi.fn(),
  mapProviderStatusToLocal: vi.fn(),
}));

vi.mock('../lib/supabaseServer.js', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  supabase: {},
  get supabaseAdminConfigured() {
    return mockConfig.supabaseAdminConfigured;
  },
}));

vi.mock('../lib/smmProvider.js', () => ({
  callSmmProvider: mockSmm.callSmmProvider,
  extractProviderError: mockSmm.extractProviderError,
  mapProviderStatusToLocal: mockSmm.mapProviderStatusToLocal,
  getProviderApiUrl: vi.fn(),
  buildProviderBody: vi.fn(),
}));

import resellerRouter from './reseller.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SERVICE_ID = '22222222-2222-4222-8222-222222222222';
const ORDER_ID = '33333333-3333-4333-8333-333333333333';
const PROVIDER_ID = '44444444-4444-4444-8444-444444444444';
const API_KEY = 'pf_test_key_123';

const activeProfile = {
  id: USER_ID,
  username: 'reseller',
  email: 'r@example.com',
  balance: 12.3456,
  status: 'active',
  api_key: API_KEY,
};

const dispatch = (router, body = {}, method = 'POST') =>
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
    };
    const req = {
      method,
      url: '/action',
      path: '/action',
      headers: {},
      query: {},
      body,
    };
    router.handle(req, response, () => resolve({ statusCode: 500, payload: { error: 'next called' } }));
  });

// Chain builder whose terminal method returns the per-table configured result.
const chain = (terminal) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  ...terminal,
});

const setTable = (table, terminal) => {
  mockSupabaseAdmin.from.mockImplementation((name) => {
    if (name === table) return chain(terminal);
    return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
  });
};

beforeEach(() => {
  vi.restoreAllMocks();
  mockConfig.supabaseAdminConfigured = true;
  mockSupabaseAdmin.from.mockReset();
  mockSupabaseAdmin.rpc.mockReset();
  mockSmm.callSmmProvider.mockReset();
  mockSmm.extractProviderError.mockReset();
  mockSmm.mapProviderStatusToLocal.mockReset();

  // Default: profile lookup succeeds with the active reseller.
  mockSupabaseAdmin.from.mockImplementation((table) => {
    if (table === 'user_profiles') {
      return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: activeProfile, error: null }) });
    }
    return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
  });
  mockSmm.extractProviderError.mockReturnValue(null);
  mockSmm.mapProviderStatusToLocal.mockReturnValue('processing');
});

describe('reseller /api/v2/action — key authentication', () => {
  it('rejects a missing API key with an SMM-style error', async () => {
    const result = await dispatch(resellerRouter, { action: 'balance' });
    expect(result.statusCode).toBe(200);
    expect(result.payload.error).toMatch(/missing api key/i);
  });

  it('rejects an unknown API key', async () => {
    setTable('user_profiles', { maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const result = await dispatch(resellerRouter, { key: 'nope', action: 'balance' });
    expect(result.payload.error).toMatch(/invalid api key/i);
  });

  it('rejects a non-active account', async () => {
    setTable('user_profiles', {
      maybeSingle: vi.fn().mockResolvedValue({
        data: { ...activeProfile, status: 'banned' },
        error: null,
      }),
    });
    const result = await dispatch(resellerRouter, { key: API_KEY, action: 'balance' });
    expect(result.payload.error).toMatch(/banned|not active/i);
  });

});

describe('reseller /api/v2/action — actions', () => {
  it('returns the wallet balance as a 2-decimal string with currency', async () => {
    const result = await dispatch(resellerRouter, { key: API_KEY, action: 'balance' });
    expect(result.payload).toEqual({ balance: '12.35', currency: 'USD' });
  });

  it('lists active services in the SMM panel shape', async () => {
    // The services query is awaited as a thenable (no maybeSingle terminal).
    const servicesChain = chain({});
    servicesChain.then = (resolve) =>
      resolve({
        data: [
          {
            id: SERVICE_ID,
            name: 'IG Followers',
            category: 'Instagram',
            rate_per_1000: '2.751840',
            min_quantity: 50,
            max_quantity: 100000,
          },
        ],
        error: null,
      });

    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: activeProfile, error: null }) });
      }
      if (table === 'services') return servicesChain;
      return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    });

    const result = await dispatch(resellerRouter, { key: API_KEY, action: 'services' });
    expect(result.statusCode).toBe(200);
    expect(result.payload).toHaveLength(1);
    expect(result.payload[0]).toMatchObject({
      service: SERVICE_ID,
      name: 'IG Followers',
      category: 'Instagram',
      rate: 2.75184,
      min: 50,
      max: 100000,
      type: 'default',
      dripfeed: false,
    });
  });

  it('places an order via the service-role RPC and forwards it to the provider', async () => {
    mockSupabaseAdmin.rpc.mockResolvedValue({
      data: { id: ORDER_ID, status: 'pending' },
      error: null,
    });
    mockSmm.callSmmProvider.mockResolvedValue({ order: 'UP-9988' });

    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: activeProfile, error: null }) });
      }
      if (table === 'provider_services') {
        const c = chain({});
        c.then = (resolve) =>
          resolve({
            data: [
              {
                provider_id: PROVIDER_ID,
                provider_service_id: '777',
                provider: { id: PROVIDER_ID, name: 'CaspersMM', api_url: 'https://x/api/v2', api_key: 'pk' },
              },
            ],
            error: null,
          });
        return c;
      }
      if (table === 'orders') {
        return chain({ then: (resolve) => resolve({ data: null, error: null }) });
      }
      return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    });

    const result = await dispatch(resellerRouter, {
      key: API_KEY,
      action: 'add',
      service: SERVICE_ID,
      link: 'https://instagram.com/p/1',
      quantity: 100,
    });

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('place_order_for_user', {
      p_user_id: USER_ID,
      p_service_id: SERVICE_ID,
      p_link: 'https://instagram.com/p/1',
      p_quantity: 100,
      p_delivery_time: 24,
    });
    expect(mockSmm.callSmmProvider).toHaveBeenCalledTimes(1);
    expect(result.payload).toEqual({ order: ORDER_ID });
  });

  it('surfaces RPC failures (e.g. insufficient balance) as SMM errors and never calls the provider', async () => {
    mockSupabaseAdmin.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Insufficient balance' },
    });

    const result = await dispatch(resellerRouter, {
      key: API_KEY,
      action: 'add',
      service: SERVICE_ID,
      link: 'https://instagram.com/p/1',
      quantity: 100,
    });

    expect(result.payload.error).toBe('Insufficient balance');
    expect(mockSmm.callSmmProvider).not.toHaveBeenCalled();
  });

  it('validates add payloads before touching the database', async () => {
    const badService = await dispatch(resellerRouter, {
      key: API_KEY,
      action: 'add',
      service: 'not-a-uuid',
      link: 'https://x',
      quantity: 10,
    });
    expect(badService.payload.error).toMatch(/service/i);

    const badQty = await dispatch(resellerRouter, {
      key: API_KEY,
      action: 'add',
      service: SERVICE_ID,
      link: 'https://x',
      quantity: -5,
    });
    expect(badQty.payload.error).toMatch(/quantity/i);
    expect(mockSupabaseAdmin.rpc).not.toHaveBeenCalled();
  });

  it('returns an owned order status in SMM vocabulary', async () => {
    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: activeProfile, error: null }) });
      }
      if (table === 'orders') {
        return chain({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: ORDER_ID,
              user_id: USER_ID,
              status: 'completed',
              charge: 1.23,
              start_count: 10,
              remains: 0,
              quantity: 100,
            },
            error: null,
          }),
        });
      }
      return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    });

    const result = await dispatch(resellerRouter, { key: API_KEY, action: 'status', order: ORDER_ID });
    expect(result.payload).toMatchObject({
      status: 'Completed',
      charge: 1.23,
      start_count: 10,
      currency: 'USD',
    });
  });

  it('returns a map of statuses for comma-separated orders and drops non-UUID input', async () => {
    const multiChain = chain({});
    multiChain.then = (resolve) =>
      resolve({
        data: [
          { id: ORDER_ID, user_id: USER_ID, status: 'processing', charge: 2.5, quantity: 200, remains: 120, start_count: 0 },
        ],
        error: null,
      });
    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: activeProfile, error: null }) });
      }
      if (table === 'orders') return multiChain;
      return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    });

    const secondOrder = '55555555-5555-4555-8555-555555555555';
    const result = await dispatch(resellerRouter, {
      key: API_KEY,
      action: 'status',
      orders: `${ORDER_ID},${secondOrder},not-a-uuid`,
    });

    expect(result.payload[ORDER_ID]).toMatchObject({ status: 'In progress', charge: 2.5, remains: 120 });
  });

  it('hides orders that do not belong to the key owner', async () => {
    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: activeProfile, error: null }) });
      }
      if (table === 'orders') {
        return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
      }
      return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    });
    const result = await dispatch(resellerRouter, { key: API_KEY, action: 'status', order: ORDER_ID });
    expect(result.payload.error).toMatch(/not found/i);
  });

  it('rejects refill for an order that is not completed', async () => {
    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: activeProfile, error: null }) });
      }
      if (table === 'orders') {
        return chain({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: ORDER_ID, user_id: USER_ID, status: 'processing' },
            error: null,
          }),
        });
      }
      return chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    });

    const result = await dispatch(resellerRouter, { key: API_KEY, action: 'refill', order: ORDER_ID });
    expect(result.payload.error).toMatch(/completed/i);
    expect(mockSmm.callSmmProvider).not.toHaveBeenCalled();
  });

  it('rejects unknown actions with the supported list', async () => {
    const result = await dispatch(resellerRouter, { key: API_KEY, action: 'explode' });
    expect(result.payload.error).toMatch(/unknown action/i);
  });
});
