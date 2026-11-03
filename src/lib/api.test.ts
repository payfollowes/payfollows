import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSessionUser = vi.hoisted(() => vi.fn());
const mockWithSupabaseTimeout = vi.hoisted(() => vi.fn((promise: Promise<unknown>) => promise));
const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
}));

vi.mock('./supabase', () => ({
  getSessionUser: mockGetSessionUser,
  supabase: mockSupabaseClient,
  withSupabaseTimeout: mockWithSupabaseTimeout,
}));

import { authAPI, paymentsAPI } from './api';

describe('auth and payments APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionUser.mockResolvedValue({ id: 'user-1' });
  });

  it('creates a profile row after a successful sign-up', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const upsertChain = {
      error: null,
    };
    mockSupabaseClient.from.mockReturnValue({
      upsert: vi.fn().mockResolvedValue(upsertChain),
    });

    const result = await authAPI.signUp('user@example.com', 'pw123', 'user');

    expect(result.user.id).toBe('user-1');
    expect(mockSupabaseClient.from).toHaveBeenCalled();
  });

  it('creates a payment through the authenticated server endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { payment: { id: 'payment-1', user_id: 'user-1', amount: 10 } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await paymentsAPI.createPayment(10, 'fastpay');

    expect(result.id).toBe('payment-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/payments/create', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ amount: 10, paymentMethod: 'fastpay' }),
    }));
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
