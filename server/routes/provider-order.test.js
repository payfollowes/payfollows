import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockContext = vi.hoisted(() => ({
  admin: { from: vi.fn(), rpc: vi.fn() },
  userId: '11111111-1111-4111-8111-111111111111',
}));

vi.mock('../lib/supabaseServer.js', () => ({
  supabase: mockContext.admin,
  supabaseAdmin: mockContext.admin,
  supabaseConfigured: true,
  supabaseAdminConfigured: true,
}));

vi.mock('../lib/authz.js', () => {
  const attachUser = (req, _res, next) => {
    req.user = { id: mockContext.userId };
    next();
  };
  return {
    requireAuth: attachUser,
    requireActiveAccount: attachUser,
    requireAdmin: attachUser,
  };
});

import providerRouter from './provider.js';

const ORDER_ID = '22222222-2222-4222-8222-222222222222';
const PROVIDER_ID = '33333333-3333-4333-8333-333333333333';

function queueDatabaseResults(results) {
  const queries = [];
  mockContext.admin.from.mockImplementation((table) => {
    const response = results[queries.length] || { data: null, error: null };
    const query = { table, calls: [] };
    queries.push(query);
    const builder = {};
    for (const method of ['select', 'update', 'eq', 'gt', 'is', 'order', 'limit']) {
      builder[method] = (...args) => {
        query.calls.push([method, ...args]);
        return builder;
      };
    }
    builder.maybeSingle = async () => response;
    builder.single = async () => response;
    return builder;
  });
  return queries;
}

function dispatch(req) {
  return new Promise((resolve) => {
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
    providerRouter.handle(req, response, () => resolve({ statusCode: 500, payload: { error: 'next called' } }));
  });
}

const request = (body) => ({
  method: 'POST',
  url: '/add-order',
  path: '/add-order',
  originalUrl: '/api/provider/add-order',
  headers: { authorization: 'Bearer test-session' },
  query: {},
  params: {},
  body,
});

describe('POST /api/provider/add-order local order dispatch', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockContext.admin.rpc.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads order inputs and provider mapping from the authenticated owner record', async () => {
    const order = {
      id: ORDER_ID,
      user_id: mockContext.userId,
      service_id: '44444444-4444-4444-8444-444444444444',
      link: 'https://www.instagram.com/example/',
      quantity: 120,
      status: 'pending',
      provider_id: null,
      provider_order_id: null,
    };
    const queries = queueDatabaseResults([
      { data: order, error: null },
      { data: { provider_id: PROVIDER_ID, provider_service_id: 'svc-42' }, error: null },
      { data: { id: PROVIDER_ID, name: 'Provider', api_key: 'secret-key', api_url: 'https://provider.example/api/v2', status: 'active' }, error: null },
      { data: { id: ORDER_ID }, error: null },
      { data: { id: ORDER_ID, status: 'pending', provider_id: PROVIDER_ID, provider_order_id: 'upstream-42' }, error: null },
    ]);
    const fetchMock = vi.fn(async (_url, init) => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ order: 'upstream-42', status: 'Pending' }),
      requestBody: init.body,
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await dispatch(request({ local_order_id: ORDER_ID }));

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({ ok: true, order: 'upstream-42' });
    expect(queries[0].calls).toContainEqual(['eq', 'user_id', mockContext.userId]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const providerRequest = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(Object.fromEntries(providerRequest.entries())).toEqual({
      action: 'add',
      service: 'svc-42',
      link: order.link,
      quantity: '120',
      key: 'secret-key',
    });
  });

  it('does not dispatch when the order is not owned by the authenticated user', async () => {
    queueDatabaseResults([{ data: null, error: null }]);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await dispatch(request({ local_order_id: ORDER_ID }));

    expect(result.statusCode).toBe(404);
    expect(result.payload.error).toBe('Order not found.');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockContext.admin.from).toHaveBeenCalledTimes(1);
  });

  it('returns the existing provider order without submitting it twice', async () => {
    queueDatabaseResults([{
      data: {
        id: ORDER_ID,
        user_id: mockContext.userId,
        status: 'processing',
        provider_order_id: 'already-submitted',
      },
      error: null,
    }]);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await dispatch(request({ local_order_id: ORDER_ID }));

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({ order: 'already-submitted', idempotent: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockContext.admin.from).toHaveBeenCalledTimes(1);
  });
});
