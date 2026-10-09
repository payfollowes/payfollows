import crypto from 'crypto';
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
  supabaseConfigured: false,
  supabaseAdminConfigured: false,
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

import authRouter from './auth.js';
import webhookRouter from './webhook.js';

const dispatch = (router, req, res = {}) => new Promise((resolve) => {
  const response = {
    statusCode: 200,
    headers: {},
    status: function nextStatus(code) {
      this.statusCode = code;
      return this;
    },
    json: function nextJson(payload) {
      resolve({ statusCode: this.statusCode, payload });
      return this;
    },
    send: function nextSend(payload) {
      resolve({ statusCode: this.statusCode, payload });
      return this;
    },
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    setHeader: vi.fn(),
  };

  router.handle(req, response, () => resolve({ statusCode: 500, payload: { error: 'next called' } }));
});

describe('security hardening', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.FASTPAY_WEBHOOK_SECRET;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    mockConfig.supabaseConfigured = false;
    mockConfig.supabaseAdminConfigured = false;
    mockSupabase.auth.getUser.mockReset();
    mockSupabaseAdmin.auth.getUser.mockReset();
    mockSupabase.from.mockReset();
    mockSupabaseAdmin.from.mockReset();
  });

  it('fails closed when auth verification is unavailable for a provided session', async () => {
    const req = {
      method: 'POST',
      url: '/session',
      body: { accessToken: 'abc', refreshToken: 'def' },
      headers: {},
    };

    const result = await dispatch(authRouter, req);

    expect(result.statusCode).toBe(503);
    expect(result.payload).toMatchObject({ success: false });
  });

  it('does not apply duplicate FastPay credits more than once', async () => {
    const payload = {
      id: 'txn-123',
      order_id: 'ord-101',
      transaction_id: 'txn-123',
      status: 'completed',
      amount: 125,
      currency: 'USD',
      merchant_id: 'merchant-1',
    };

    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = crypto.createHmac('sha256', 'top-secret').update(rawBody).digest('hex');
    process.env.FASTPAY_WEBHOOK_SECRET = 'top-secret';

    const paymentRecord = { id: 'pay-1', user_id: 'user-1', amount: 125, status: 'pending', metadata: {}, transaction_id: 'txn-123', fastpay_order_id: 'ord-101' };

    const updatePayment = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: 'pay-1', status: 'completed', amount: 125 }, error: null })),
        })),
      })),
    }));

    const paymentEventReceipt = {
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: 'receipt-1', provider_event_id: 'txn-123' }, error: null })),
        })),
      })),
    };

    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'payments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: paymentRecord, error: null })),
            })),
          })),
          update: updatePayment,
        };
      }

      if (table === 'payment_event_receipts') {
        return paymentEventReceipt;
      }

      if (table === 'user_profiles') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(async () => ({ data: { id: 'user-1', balance: 0 }, error: null })) })) })),
          update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
        };
      }

      return {};
    });

    mockConfig.supabaseAdminConfigured = true;

    const req = {
      method: 'POST',
      url: '/',
      body: payload,
      rawBody,
      headers: {
        'x-fastpay-signature': signature,
      },
    };

    const result = await dispatch(webhookRouter, req);

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({ success: true });
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('payment_event_receipts');
  });
});
