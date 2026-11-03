import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSupabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
const mockConfig = vi.hoisted(() => ({
  supabaseConfigured: true,
  supabaseAdminConfigured: true,
}));

vi.mock('../lib/supabaseServer.js', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabase,
  get supabaseConfigured() {
    return mockConfig.supabaseConfigured;
  },
  get supabaseAdminConfigured() {
    return mockConfig.supabaseAdminConfigured;
  },
}));

import paymentsRouter from './payments.js';

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
    };
    router.handle(req, response, () => resolve({ statusCode: 500, payload: { error: 'next called' } }));
  });

describe('GET /api/payments/methods capability map', () => {
  const gatewayKeys = [
    'FASTPAY_API_KEY',
    'FASTPAY_MERCHANT_ID',
    'FASTPAY_WEBHOOK_SECRET',
    'FASTPAY_WEBHOOK_URL',
    'VITE_FASTPAY_API_KEY',
    'VITE_FASTPAY_MERCHANT_ID',
    'PAYFAST_MERCHANT_ID',
    'PAYFAST_MERCHANT_KEY',
  ];
  const saved = {};

  beforeEach(() => {
    gatewayKeys.forEach((k) => {
      saved[k] = process.env[k];
      delete process.env[k];
    });
  });

  afterEach(() => {
    gatewayKeys.forEach((k) => {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });

  it('marks every gateway unavailable when no credentials exist', async () => {
    const result = await dispatch(paymentsRouter, {
      method: 'GET',
      url: '/methods',
      path: '/methods',
      headers: {},
      query: {},
      body: {},
    });

    expect(result.statusCode).toBe(200);
    const methods = result.payload.data.methods;
    expect(methods.find((m) => m.id === 'fastpay').available).toBe(false);
    expect(methods.find((m) => m.id === 'payfast').available).toBe(false);
    expect(methods.filter((m) => m.comingSoon).length).toBe(5);
    // Never leak credential material, only booleans.
    expect(JSON.stringify(result.payload)).not.toMatch(/KEY|SECRET|PASSPHRASE/i);
  });

  it('lights up FastPay when its key and merchant id are configured', async () => {
    process.env.FASTPAY_API_KEY = 'sk_test';
    process.env.FASTPAY_MERCHANT_ID = 'mid_test';
    process.env.FASTPAY_WEBHOOK_SECRET = 'whsec_test';
    process.env.FASTPAY_WEBHOOK_URL = 'https://api.example.test/webhook/fastpay';

    const result = await dispatch(paymentsRouter, {
      method: 'GET',
      url: '/methods',
      path: '/methods',
      headers: {},
      query: {},
      body: {},
    });

    const methods = result.payload.data.methods;
    expect(methods.find((m) => m.id === 'fastpay')).toMatchObject({
      available: true,
      endpoint: '/api/fastpay/create-order',
    });
    expect(methods.find((m) => m.id === 'payfast').available).toBe(false);
  });

  it('returns only active admin-configured manual methods without leaking settings', async () => {
    const config = {
      fastpayEnabled: false,
      payment: { fastpayApiKey: 'must-not-leak' },
      paymentMethods: [
        { id: 'jazzcash', name: 'JazzCash', region: 'Pakistan', accountName: 'PayFollows', accountDetails: '03001234567', instructions: 'Send the amount, then enter your reference.', minimumAmount: 5, active: true },
        { id: 'hidden-bank', name: 'Hidden bank', accountDetails: 'IBAN', instructions: 'Do not show', active: false },
      ],
    };
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn().mockResolvedValue({ data: { config }, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce(query);
    const result = await dispatch(paymentsRouter, {
      method: 'GET', url: '/methods', path: '/methods', headers: {}, query: {}, body: {},
    });
    const methods = result.payload.data.methods;
    expect(methods.find((method) => method.id === 'fastpay').available).toBe(false);
    expect(methods.find((method) => method.id === 'jazzcash')).toMatchObject({
      available: true, type: 'manual', accountDetails: '03001234567',
    });
    expect(methods.some((method) => method.id === 'hidden-bank')).toBe(false);
    expect(JSON.stringify(result.payload)).not.toContain('must-not-leak');
  });

  it('keeps PayFast disabled until its verified-credit flow is implemented', async () => {
    process.env.PAYFAST_MERCHANT_ID = 'pf_id';
    // Missing PAYFAST_MERCHANT_KEY -> still unavailable.
    const partial = await dispatch(paymentsRouter, {
      method: 'GET',
      url: '/methods',
      path: '/methods',
      headers: {},
      query: {},
      body: {},
    });
    expect(partial.payload.data.methods.find((m) => m.id === 'payfast').available).toBe(false);

    process.env.PAYFAST_MERCHANT_KEY = 'pf_key';
    const full = await dispatch(paymentsRouter, {
      method: 'GET',
      url: '/methods',
      path: '/methods',
      headers: {},
      query: {},
      body: {},
    });
    expect(full.payload.data.methods.find((m) => m.id === 'payfast').available).toBe(false);
  });
});
