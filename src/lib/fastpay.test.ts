import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FastPayClient } from './fastpay';

describe('FastPayClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates an order and exposes the checkout URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        order_id: 'order_123',
        payment_url: 'https://pay.test/checkout',
        transaction_id: 'txn_123',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new FastPayClient({ merchantId: 'merchant-1', apiKey: 'secret', baseUrl: 'https://example.test' });
    const result = await client.createOrder({
      amount: 12.5,
      orderId: 'order_123',
      customerEmail: 'user@example.com',
      returnUrl: 'https://payfollows.test/return',
      cancelUrl: 'https://payfollows.test/cancel',
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBe('order_123');
    expect(result.paymentUrl).toBe('https://pay.test/checkout');
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/orders', expect.objectContaining({ method: 'POST' }));
  });

  it('returns false for non-successful payment verification responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ status: 'failed' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new FastPayClient({ merchantId: 'merchant-1', apiKey: 'secret', baseUrl: 'https://example.test' });
    const verified = await client.verifyPayment('txn_123');

    expect(verified).toBe(false);
  });
});
